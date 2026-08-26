'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAdminRequest, studentUserId } from '@/lib/supabase/auth-guard';
import type { ChatMessage, ConversationSummary } from '@/lib/types';

// Every action returns this shape (mirrors enrollment/submissions actions).
// `message` is a stable key the client maps to a localized string, not
// user-facing prose.
type ActionResult = { success: boolean; message: string };

type RequestClient = Awaited<ReturnType<typeof createClient>>;

// ---------------------------------------------------------------------------
// Row shapes — mirror the live migration (no generated DB types in this repo)
// ---------------------------------------------------------------------------

interface MessageRow {
    id: string;
    sender_id: string;
    recipient_id: string;
    body: string;
    read_at: string | null;
    created_at: string;
}

interface ProfileNameRow {
    id: string;
    name: string | null;
}

const MAX_BODY_LENGTH = 4000;
const THREAD_LIMIT = 200;
const INBOX_SCAN_LIMIT = 400;
const PREVIEW_LENGTH = 120;

// PostgREST `.or()` interpolates ids into the filter expression, so every id
// that reaches it must be a bare UUID — never free-form user input.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
    return UUID_RE.test(value);
}

function mapMessageRow(row: MessageRow): ChatMessage {
    return {
        id: row.id,
        senderId: row.sender_id,
        recipientId: row.recipient_id,
        body: row.body,
        ...(row.read_at != null ? { readAt: row.read_at } : {}),
        createdAt: row.created_at,
    };
}

async function currentUserId(supabase: RequestClient): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
}

/** SECURITY DEFINER rpc returning the single admin's auth.users id. */
async function fetchTeacherId(supabase: RequestClient): Promise<string | null> {
    const { data, error } = await supabase.rpc('get_teacher_id');
    if (error) {
        console.error('get_teacher_id failed:', error);
        return null;
    }
    return typeof data === 'string' && isUuid(data) ? data : null;
}

/** Loads one bidirectional thread, oldest first. RLS already scopes rows to
 *  participants; the explicit pair filter keeps the query exact anyway. */
async function loadThread(
    supabase: RequestClient,
    me: string,
    counterpart: string,
    limit: number
): Promise<ChatMessage[]> {
    if (!isUuid(me) || !isUuid(counterpart)) return [];
    const pairFilter =
        `and(sender_id.eq.${me},recipient_id.eq.${counterpart}),` +
        `and(sender_id.eq.${counterpart},recipient_id.eq.${me})`;
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(pairFilter)
        .order('created_at', { ascending: true })
        .limit(limit);
    if (error) {
        console.error('Failed to load message thread:', error);
        return [];
    }
    return ((data ?? []) as MessageRow[]).map(mapMessageRow);
}

/** Marks the counterpart's incoming messages as read. Best-effort: a failed
 *  update only means stale ✓✓ receipts — it must never break the read. */
async function markThreadRead(
    supabase: RequestClient,
    me: string,
    counterpart: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('recipient_id', me)
            .eq('sender_id', counterpart)
            .is('read_at', null);
        if (error) throw error;
    } catch (error) {
        console.warn('Failed to mark messages read:', error);
    }
}

/** Push notification to the counterpart. Called strictly AFTER a successful
 *  insert; failures are logged and swallowed so sending never blocks on the
 *  notification path. */
async function notifyCounterpart(
    supabase: RequestClient,
    recipientId: string,
    body: string
): Promise<void> {
    try {
        const { error } = await supabase.rpc('notify_counterpart', {
            p_recipient: recipientId,
            p_type: 'new_message',
            p_payload: { preview: body.slice(0, PREVIEW_LENGTH) },
        });
        if (error) throw error;
    } catch (error) {
        console.warn('notify_counterpart failed:', error);
    }
}

// ---------------------------------------------------------------------------
// Shared helper — either authenticated role may resolve the teacher id
// ---------------------------------------------------------------------------

export async function getTeacherId(): Promise<string | null> {
    const supabase = await createClient();
    const me = await currentUserId(supabase);
    if (!me) return null;
    return fetchTeacherId(supabase);
}

// ---------------------------------------------------------------------------
// Student side (request-bound client → participant RLS applies)
// ---------------------------------------------------------------------------

export async function getMyThread(counterpartId: string): Promise<ChatMessage[]> {
    const me = await studentUserId();
    if (!me || !isUuid(counterpartId)) return [];

    const supabase = await createClient();

    // Students talk to exactly one counterpart: the teacher. Anything else is
    // rejected BEFORE querying so a crafted id cannot probe other students'
    // threads (RLS would hide those rows regardless — this fails closed too).
    const teacherId = await fetchTeacherId(supabase);
    if (!teacherId || counterpartId !== teacherId) return [];

    const messages = await loadThread(supabase, me, teacherId, THREAD_LIMIT);
    await markThreadRead(supabase, me, teacherId);
    return messages;
}

const studentMessageSchema = z.object({
    body: z.string().trim().min(1).max(MAX_BODY_LENGTH),
});

export async function sendMessageToTeacher(formData: FormData): Promise<ActionResult> {
    const me = await studentUserId();
    if (!me) return { success: false, message: 'unauthorized' };

    const parsed = studentMessageSchema.safeParse({ body: formData.get('body') });
    if (!parsed.success) return { success: false, message: 'invalid_input' };
    const { body } = parsed.data;

    const supabase = await createClient();
    const teacherId = await fetchTeacherId(supabase);
    if (!teacherId) return { success: false, message: 'send_failed' };

    try {
        // Recipient is server-resolved from get_teacher_id() — never client
        // input — so a student can only ever address the teacher.
        const { error } = await supabase.from('messages').insert({
            sender_id: me,
            recipient_id: teacherId,
            body,
        });
        if (error) throw error;
    } catch (error) {
        console.error('Failed to send student message:', error);
        return { success: false, message: 'send_failed' };
    }

    await notifyCounterpart(supabase, teacherId, body);

    revalidatePath('/dashboard/messages');
    return { success: true, message: 'sent' };
}

// ---------------------------------------------------------------------------
// Admin side (isAdminRequest gate → admin RLS reads all messages)
// ---------------------------------------------------------------------------

interface ConversationGroup {
    newest: MessageRow;
    unread: number;
}

export async function getAdminConversations(): Promise<ConversationSummary[]> {
    if (!(await isAdminRequest())) return [];

    const supabase = await createClient();
    const me = await currentUserId(supabase);
    if (!me) return [];

    // Newest-first scan; grouping below keeps only the newest row per pair,
    // so this limit bounds work without missing recent conversations.
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(INBOX_SCAN_LIMIT);
    if (error) {
        console.error('Failed to load conversations:', error);
        return [];
    }

    const groups = new Map<string, ConversationGroup>();
    for (const row of (data ?? []) as MessageRow[]) {
        const counterpartId = row.sender_id !== me ? row.sender_id : row.recipient_id;
        const existing = groups.get(counterpartId);
        const countsAsUnread = row.recipient_id === me && row.read_at == null;
        if (!existing) {
            groups.set(counterpartId, {
                newest: row,
                unread: countsAsUnread ? 1 : 0,
            });
        } else if (countsAsUnread) {
            existing.unread += 1;
        }
    }

    // Display names via profiles; unknown ids fall back to a neutral label.
    const names = new Map<string, string>();
    const ids = [...groups.keys()];
    if (ids.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', ids);
        for (const profile of (profiles ?? []) as ProfileNameRow[]) {
            if (profile.name) names.set(profile.id, profile.name);
        }
    }

    const out: ConversationSummary[] = [];
    for (const [counterpartId, group] of groups) {
        out.push({
            counterpartId,
            counterpartName: names.get(counterpartId) ?? 'Student',
            lastMessagePreview: group.newest.body.slice(0, PREVIEW_LENGTH),
            lastMessageAt: group.newest.created_at,
            unreadCount: group.unread,
        });
    }
    out.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    return out;
}

export async function getThreadWithUser(userId: string): Promise<ChatMessage[]> {
    if (!(await isAdminRequest())) return [];
    if (!isUuid(userId)) return [];

    const supabase = await createClient();
    const me = await currentUserId(supabase);
    if (!me) return [];

    const messages = await loadThread(supabase, me, userId, THREAD_LIMIT);
    await markThreadRead(supabase, me, userId);
    return messages;
}

const adminMessageSchema = z.object({
    recipientId: z.string().uuid(),
    body: z.string().trim().min(1).max(MAX_BODY_LENGTH),
});

export async function sendAdminMessage(formData: FormData): Promise<ActionResult> {
    if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

    const parsed = adminMessageSchema.safeParse({
        recipientId: formData.get('recipientId'),
        body: formData.get('body'),
    });
    if (!parsed.success) return { success: false, message: 'invalid_input' };
    const { recipientId, body } = parsed.data;

    const supabase = await createClient();

    // The recipient must be an existing student — prevents messaging random
    // auth users. list_students() shape is defensive: rows or bare ids.
    const { data: students, error: studentsError } = await supabase.rpc('list_students');
    if (studentsError) {
        console.error('list_students failed:', studentsError);
        return { success: false, message: 'not_found' };
    }
    const studentIds = new Set(
        ((students ?? []) as unknown[]).flatMap((entry): string[] => {
            if (typeof entry === 'string' && isUuid(entry)) return [entry];
            if (
                entry !== null &&
                typeof entry === 'object' &&
                typeof (entry as { id?: unknown }).id === 'string'
            ) {
                return [(entry as { id: string }).id];
            }
            return [];
        })
    );
    if (!studentIds.has(recipientId)) return { success: false, message: 'not_found' };

    const me = await currentUserId(supabase);
    if (!me) return { success: false, message: 'unauthorized' };

    try {
        const { error } = await supabase.from('messages').insert({
            sender_id: me,
            recipient_id: recipientId,
            body,
        });
        if (error) throw error;
    } catch (error) {
        console.error('Failed to send admin message:', error);
        return { success: false, message: 'send_failed' };
    }

    await notifyCounterpart(supabase, recipientId, body);

    revalidatePath('/admin/inbox');
    revalidatePath(`/admin/inbox/${recipientId}`);
    return { success: true, message: 'sent' };
}
