'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { studentUserId } from '@/lib/supabase/auth-guard';
import type { NotificationItem } from '@/lib/types';

// Every action returns this shape (mirrors the other action modules).
// `message` is a stable key the client maps to a localized string.
type ActionResult = { success: boolean; message: string };

interface NotificationRow {
    id: string;
    type: string;
    payload: NotificationItem['payload'] | null;
    read: boolean;
    created_at: string;
}

export async function getMyNotifications(): Promise<NotificationItem[]> {
    const userId = await studentUserId();
    if (!userId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Failed to load notifications:', error);
        return [];
    }

    return ((data ?? []) as NotificationRow[]).map((row) => ({
        id: row.id,
        type: row.type as NotificationItem['type'],
        payload: row.payload ?? {},
        read: row.read,
        createdAt: row.created_at,
    }));
}

export async function getUnreadCount(): Promise<number> {
    const userId = await studentUserId();
    if (!userId) return 0;

    const supabase = await createClient();
    const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

    if (error) {
        console.error('Failed to count unread notifications:', error);
        return 0;
    }
    return count ?? 0;
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
    const userId = await studentUserId();
    if (!userId) return { success: false, message: 'unauthorized' };

    const supabase = await createClient();
    try {
        // RLS scopes the update to the caller's own rows; `neq read, true`
        // skips already-read rows so the write touches as little as possible.
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .neq('read', true);
        if (error) throw error;

        revalidatePath('/dashboard');
        return { success: true, message: 'marked_read' };
    } catch (error) {
        console.error('Failed to mark notifications read:', error);
        return { success: false, message: 'mark_failed' };
    }
}
