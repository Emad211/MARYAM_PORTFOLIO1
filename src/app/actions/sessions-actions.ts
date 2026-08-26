'use server';

import { createClient } from '@/lib/supabase/server';
import { studentUserId } from '@/lib/supabase/auth-guard';
import type {
    AttendanceStatus,
    LocalizedString,
    SessionWithAttendance,
} from '@/lib/types';

// Every mutation returns this shape (mirrors enrollment-actions). `message`
// is a stable key the client maps to a localized string, not user-facing prose.
export type ActionResult = { success: boolean; message: string };

// ---------------------------------------------------------------------------
// Raw DB row shapes (JSONB columns arrive untyped; mappers live inline here
// because live_sessions / session_attendance are not part of
// lib/supabase/mappers.ts). timestamptz columns arrive as ISO strings.
// ---------------------------------------------------------------------------

interface LiveSessionRow {
    id: string;
    class_slug: string;
    title: unknown;
    starts_at: string;
    duration_min: number;
    meeting_url: string | null;
    location_note: unknown | null;
}

interface AttendanceRow {
    session_id: string;
    status: string;
}

function mapSessionRow(row: LiveSessionRow): SessionWithAttendance {
    return {
        id: row.id,
        classSlug: row.class_slug,
        title: row.title as LocalizedString,
        startsAt: row.starts_at,
        durationMin: row.duration_min,
        ...(row.meeting_url ? { meetingUrl: row.meeting_url } : {}),
        ...(row.location_note ? { locationNote: row.location_note as LocalizedString } : {}),
    };
}

/**
 * Sessions for the signed-in student, split at "now".
 *
 * Reads go through the request-bound client so RLS (approved-enrolled-or-admin
 * on `live_sessions`, owner-read on `session_attendance`) scopes every row to
 * the caller — which is also why this action can never be ISR-cached. The
 * query returns ascending by start; past sessions are reversed to read
 * newest-first. A session with no attendance row simply has no `attendance`
 * field (treated as pending by the UI).
 */
export async function getMySessions(): Promise<{
    upcoming: SessionWithAttendance[];
    past: SessionWithAttendance[];
}> {
    const userId = await studentUserId();
    if (!userId) return { upcoming: [], past: [] };

    const supabase = await createClient();
    const { data: sessionData, error: sessionError } = await supabase
        .from('live_sessions')
        .select('*')
        .order('starts_at');
    if (sessionError || !sessionData) {
        console.error('Failed to load live sessions:', sessionError);
        return { upcoming: [], past: [] };
    }

    const { data: attendanceData, error: attendanceError } = await supabase
        .from('session_attendance')
        .select('session_id, status')
        .eq('user_id', userId);
    if (attendanceError) {
        // Non-fatal: sessions still render, just without attendance marks.
        console.error('Failed to load own attendance:', attendanceError);
    }
    const attendanceBySession = new Map<string, AttendanceStatus>();
    for (const row of (attendanceData ?? []) as AttendanceRow[]) {
        attendanceBySession.set(row.session_id, row.status as AttendanceStatus);
    }

    const nowIso = new Date().toISOString();
    const upcoming: SessionWithAttendance[] = [];
    const past: SessionWithAttendance[] = [];
    for (const row of sessionData as LiveSessionRow[]) {
        const attendance = attendanceBySession.get(row.id);
        const entry: SessionWithAttendance = {
            ...mapSessionRow(row),
            ...(attendance ? { attendance } : {}),
        };
        if (row.starts_at < nowIso) {
            past.push(entry);
        } else {
            upcoming.push(entry);
        }
    }
    past.reverse();
    return { upcoming, past };
}
