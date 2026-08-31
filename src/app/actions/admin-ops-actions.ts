
'use server';

import { createClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/supabase/auth-guard';

/**
 * Daily-operations snapshot for the admin dashboard cockpit.
 *
 * Pure read model (no ActionResult wrapper): returns null when the caller is
 * not an admin so the page can fall back to analytics-only rendering. All
 * queries run through the request-bound client — admin RLS applies for real.
 */

export interface OpsSession {
    id: string;
    classSlug: string;
    /** Persian title with English fallback (admin UI is Persian-first). */
    titleFa: string;
    startsAt: string;
    meetingUrl?: string;
}

export interface OpsOverview {
    pendingEnrollments: number;
    pendingSubmissions: number;
    pendingPayments: number;
    unreadMessages: number;
    nextSessions: OpsSession[];
}

interface SessionRow {
    id: string;
    class_slug: string;
    title: { fa?: string; en?: string } | null;
    starts_at: string;
    meeting_url: string | null;
}

type RequestClient = Awaited<ReturnType<typeof createClient>>;

// The teacher id must be a bare UUID before it reaches
// `.eq('recipient_id', ...)` (same rule as messages-actions).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function countPending(
    supabase: RequestClient,
    table: 'enrollments' | 'submissions' | 'payments'
): Promise<number> {
    const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
    if (error) {
        console.error(`Failed to count pending rows in '${table}':`, error);
        return 0;
    }
    return count ?? 0;
}

async function countUnreadMessages(supabase: RequestClient): Promise<number> {
    const { data, error: rpcError } = await supabase.rpc('get_teacher_id');
    if (rpcError) {
        console.error('get_teacher_id failed:', rpcError);
        return 0;
    }
    if (typeof data !== 'string' || !UUID_RE.test(data)) return 0;

    const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', data)
        .is('read_at', null);
    if (error) {
        console.error('Failed to count unread messages:', error);
        return 0;
    }
    return count ?? 0;
}

async function loadNextSessions(supabase: RequestClient): Promise<OpsSession[]> {
    const { data, error } = await supabase
        .from('live_sessions')
        .select('id,class_slug,title,starts_at,meeting_url')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);
    if (error) {
        console.error('Failed to load upcoming sessions:', error);
        return [];
    }
    return ((data ?? []) as SessionRow[]).map((row) => ({
        id: row.id,
        classSlug: row.class_slug,
        titleFa: row.title?.fa || row.title?.en || row.class_slug,
        startsAt: row.starts_at,
        ...(row.meeting_url ? { meetingUrl: row.meeting_url } : {}),
    }));
}

export async function getOpsOverview(): Promise<OpsOverview | null> {
    if (!(await isAdminRequest())) return null;

    const supabase = await createClient();

    const [pendingEnrollments, pendingSubmissions, pendingPayments, unreadMessages, nextSessions] =
        await Promise.all([
            countPending(supabase, 'enrollments'),
            countPending(supabase, 'submissions'),
            countPending(supabase, 'payments'),
            countUnreadMessages(supabase),
            loadNextSessions(supabase),
        ]);

    return {
        pendingEnrollments,
        pendingSubmissions,
        pendingPayments,
        unreadMessages,
        nextSessions,
    };
}
