'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/supabase/auth-guard';
import type {
    AttendanceStatus,
    LocalizedString,
    RosterEntry,
} from '@/lib/types';

/**
 * Admin-side live-session scheduling & roster actions.
 *
 * Every action is gated by `isAdminRequest()` (defense-in-depth with the
 * admin-write RLS policies on `live_sessions` / `session_attendance`) and
 * writes through the request-bound Supabase client so RLS is exercised for
 * real. `starts_at` is authored as a datetime-local string ("YYYY-MM-DDTHH:mm",
 * interpreted in the admin's local timezone) and stored as a timestamptz ISO
 * string. On INSERT the SECURITY DEFINER rpc `notify_class_session` fans
 * notifications out to approved students; its failure is logged, never fatal.
 */

export interface ActionResult {
  success: boolean;
  message: string;
  /** Populated on successful insert so the client can link the new session immediately. */
  id?: string;
}

const idSchema = z.string().uuid();

const localizedSchema = z.object({
  en: z.string().min(1),
  de: z.string().min(1),
  fa: z.string().min(1),
});

// --- FormData helpers ---

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

/**
 * Normalizes a required trilingual triple from formData keys
 * `${prefix}En/${prefix}De/${prefix}Fa`. Persian is required and acts as the
 * fallback for blank English/German values (house normalization rule), so
 * stored jsonb never contains empty en/de holes.
 */
function readLocalized(formData: FormData, prefix: string): LocalizedString | null {
  const fa = str(formData, `${prefix}Fa`).trim();
  if (!fa) return null;
  const en = str(formData, `${prefix}En`).trim() || fa;
  const de = str(formData, `${prefix}De`).trim() || fa;
  return { en, de, fa };
}

/**
 * Optional trilingual triple: omitted entirely when all three fields are
 * blank; otherwise blank slots fall back to whichever value exists so the
 * stored jsonb keeps the no-empty-hole invariant.
 */
function readLocalizedOptional(formData: FormData, prefix: string): LocalizedString | null {
  const en = str(formData, `${prefix}En`).trim();
  const de = str(formData, `${prefix}De`).trim();
  const fa = str(formData, `${prefix}Fa`).trim();
  if (!en && !de && !fa) return null;
  const fallback = fa || en || de;
  return { en: en || fallback, de: de || fallback, fa: fallback };
}

/** datetime-local shape: "YYYY-MM-DDTHH:mm" (no seconds/timezone). */
const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function parseStartsAt(raw: string): string | null {
  if (!DATETIME_LOCAL_RE.test(raw)) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Blank → default 60; otherwise coerced to an integer clamped into 10..480. */
function clampDurationMin(formData: FormData): number {
  const raw = str(formData, 'durationMin').trim();
  const parsed = raw === '' ? 60 : Math.round(Number(raw));
  if (!Number.isFinite(parsed)) return 60;
  return Math.min(480, Math.max(10, parsed));
}

// --- Sessions ---

/** All sessions for the scheduler (admin RLS reads every row). */
export async function getAdminSessions() {
  if (!(await isAdminRequest())) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('live_sessions')
    .select('*')
    .order('starts_at', { ascending: true });
  const rows = (data ?? []) as Array<{
    id: string;
    class_slug: string;
    title: LocalizedString;
    starts_at: string;
    duration_min: number;
    meeting_url: string | null;
    location_note: LocalizedString | null;
    notes: string | null;
  }>;
  return rows.map((row) => ({
    id: row.id,
    classSlug: row.class_slug,
    title: row.title,
    startsAt: row.starts_at,
    durationMin: row.duration_min,
    ...(row.meeting_url ? { meetingUrl: row.meeting_url } : {}),
    ...(row.location_note ? { locationNote: row.location_note } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
  }));
}

export async function upsertLiveSession(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const rawId = str(formData, 'id').trim();
  if (formData.has('notes') && str(formData, 'notes').length > 5000) {
    console.error('upsertLiveSession validation failed: notes exceeds 5000 characters');
    return { success: false, message: 'invalid_input' };
  }
  const startsAtIso = parseStartsAt(str(formData, 'startsAtLocal').trim());
  const meetingUrlRaw = str(formData, 'meetingUrl').trim();
  const locationNoteInput = readLocalizedOptional(formData, 'locationNote');
  const parsed = z
    .object({
      id: idSchema.optional(),
      classSlug: z.string().min(1).max(120),
      title: localizedSchema,
      startsAt: z.string(),
      durationMin: z.number().int().min(10).max(480),
      meetingUrl: z.string().url(),
      locationNote: localizedSchema,
    })
    .safeParse({
      ...(rawId ? { id: rawId } : {}),
      classSlug: str(formData, 'classSlug').trim(),
      title: readLocalized(formData, 'title'),
      ...(startsAtIso ? { startsAt: startsAtIso } : {}),
      durationMin: clampDurationMin(formData),
      ...(meetingUrlRaw ? { meetingUrl: meetingUrlRaw } : {}),
      ...(locationNoteInput ? { locationNote: locationNoteInput } : {}),
    });

  if (!parsed.success) {
    console.error('upsertLiveSession validation failed:', parsed.error.flatten());
    return { success: false, message: 'invalid_input' };
  }
  const { classSlug, title, startsAt, durationMin, meetingUrl, locationNote } = parsed.data;

  try {
    const supabase = await createClient();

    // Scheduling conflict guard: the teacher cannot be in two sessions at
    // once, so reject any time-range overlap with another live session
    // (JS interval intersection over the admin-readable set, own row excluded).
    const { data: otherSessions, error: fetchError } = await supabase
      .from('live_sessions')
      .select('id, starts_at, duration_min');
    if (fetchError) throw fetchError;
    const ownId = parsed.data.id;
    const newStartMs = Date.parse(startsAt);
    const newEndMs = newStartMs + durationMin * 60000;
    const hasConflict = (
      (otherSessions ?? []) as Array<{ id: string; starts_at: string; duration_min: number }>
    ).some((row) => {
      if (ownId !== undefined && row.id === ownId) return false;
      const startMs = Date.parse(row.starts_at);
      if (Number.isNaN(startMs)) return false;
      return newStartMs < startMs + row.duration_min * 60000 && startMs < newEndMs;
    });
    if (hasConflict) return { success: false, message: 'conflict' };

    const row = {
      class_slug: classSlug,
      title,
      starts_at: startsAt,
      duration_min: durationMin,
      ...(meetingUrl ? { meeting_url: meetingUrl } : {}),
      ...(locationNote ? { location_note: locationNote } : {}),
      // Omitted key leaves a stored value untouched; blank clears it.
      ...(formData.has('notes') ? { notes: str(formData, 'notes') || null } : {}),
    };
    let savedId = parsed.data.id;
    if (savedId !== undefined) {
      const { error } = await supabase.from('live_sessions').update(row).eq('id', savedId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('live_sessions').insert(row).select('id').single();
      if (error) throw error;
      savedId = data?.id;

      // Best-effort fan-out to approved students; notification failure must
      // not fail the save itself.
      if (savedId) {
        try {
          const { error: rpcError } = await supabase.rpc('notify_class_session', {
            p_class_slug: classSlug,
            p_session_id: savedId,
          });
          if (rpcError) console.error('notify_class_session failed:', rpcError);
        } catch (rpcError) {
          console.error('notify_class_session threw:', rpcError);
        }
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/classes');
    return { success: true, message: 'saved', ...(savedId ? { id: savedId } : {}) };
  } catch (error) {
    console.error('Failed to save live session:', error);
    return { success: false, message: 'save_failed' };
  }
}

export async function deleteLiveSession(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const parsed = z.object({ id: idSchema }).safeParse({ id: str(formData, 'id').trim() });
  if (!parsed.success) {
    console.error('deleteLiveSession validation failed:', parsed.error.flatten());
    return { success: false, message: 'delete_failed' };
  }

  try {
    const supabase = await createClient();
    // Attendance rows cascade via the DB FK on session_id.
    const { error } = await supabase.from('live_sessions').delete().eq('id', parsed.data.id);
    if (error) throw error;

    revalidatePath('/dashboard');
    revalidatePath('/classes');
    return { success: true, message: 'deleted' };
  } catch (error) {
    console.error('Failed to delete live session:', error);
    return { success: false, message: 'delete_failed' };
  }
}

// --- Roster & attendance ---

interface RosterProfileRow {
  id: string;
  name: string;
}

interface RosterAttendanceRow {
  user_id: string;
  status: string;
}

export async function getRoster(sessionId: string): Promise<RosterEntry[]> {
  if (!(await isAdminRequest())) return [];

  const parsed = idSchema.safeParse(sessionId);
  if (!parsed.success) return [];

  try {
    const supabase = await createClient();

    const { data: sessionData, error: sessionError } = await supabase
      .from('live_sessions')
      .select('class_slug')
      .eq('id', sessionId)
      .maybeSingle();
    if (sessionError || !sessionData) {
      if (sessionError) console.error(`Failed to load session '${sessionId}':`, sessionError);
      return [];
    }
    const classSlug = (sessionData as { class_slug: string }).class_slug;

    // Admin RLS reads every enrollment row for the class.
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('class_slug', classSlug)
      .eq('status', 'approved');
    if (enrollmentError || !enrollmentData) {
      console.error(`Failed to load enrollments for '${classSlug}':`, enrollmentError);
      return [];
    }
    const userIds = [...new Set((enrollmentData as { user_id: string }[]).map((r) => r.user_id))];
    if (userIds.length === 0) return [];

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);
    if (profileError || !profileData) {
      console.error('Failed to load profiles for roster:', profileError);
      return [];
    }

    const { data: attendanceData, error: attendanceError } = await supabase
      .from('session_attendance')
      .select('user_id, status')
      .eq('session_id', sessionId);
    if (attendanceError) {
      // Non-fatal: roster renders with everyone pending.
      console.error(`Failed to load attendance for session '${sessionId}':`, attendanceError);
    }
    const statusByUser = new Map<string, AttendanceStatus>();
    for (const row of (attendanceData ?? []) as RosterAttendanceRow[]) {
      statusByUser.set(row.user_id, row.status as AttendanceStatus);
    }

    const nameById = new Map(
      (profileData as RosterProfileRow[]).map((p) => [p.id, p.name])
    );
    return userIds
      .map((userId) => ({
        userId,
        name: nameById.get(userId) ?? '',
        attendance: statusByUser.get(userId) ?? ('pending' as AttendanceStatus),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Failed to build roster:', error);
    return [];
  }
}

export async function saveAttendance(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  let rawEntries: unknown;
  try {
    rawEntries = JSON.parse(str(formData, 'entries'));
  } catch {
    console.error('saveAttendance: entries field is not valid JSON');
    return { success: false, message: 'invalid_input' };
  }

  const parsed = z
    .object({
      sessionId: idSchema,
      entries: z
        .array(
          z.object({
            userId: z.string().uuid(),
            status: z.enum(['present', 'absent', 'excused', 'pending']),
          })
        )
        .max(50),
    })
    .safeParse({ sessionId: str(formData, 'sessionId').trim(), entries: rawEntries });

  if (!parsed.success) {
    console.error('saveAttendance validation failed:', parsed.error.flatten());
    return { success: false, message: 'invalid_input' };
  }
  const { sessionId, entries } = parsed.data;

  try {
    const supabase = await createClient();
    const notedAt = new Date().toISOString();
    // Composite PK (session_id, user_id) makes each upsert idempotent; the
    // loop is fine at the ≤50-entry cap.
    for (const entry of entries) {
      const { error } = await supabase.from('session_attendance').upsert({
        session_id: sessionId,
        user_id: entry.userId,
        status: entry.status,
        noted_at: notedAt,
      });
      if (error) throw error;
    }
    revalidatePath('/dashboard');
    return { success: true, message: 'saved' };
  } catch (error) {
    console.error('Failed to save attendance:', error);
    return { success: false, message: 'save_failed' };
  }
}
