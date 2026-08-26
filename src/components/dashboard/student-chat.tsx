'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { getMyThread } from '@/app/actions/messages-actions';
import { ChatThread } from '@/components/dashboard/chat-thread';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import type { ChatMessage } from '@/lib/types';

/**
 * Student side of the chat: always talks to the single teacher (admin).
 * Polls the thread every 20s so replies from Maryam appear without a reload.
 */
export function StudentChat({ teacherId }: { teacherId: string | null }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [, startTransition] = useTransition();

    const refresh = useCallback(async () => {
        if (!teacherId) return;
        const thread = await getMyThread(teacherId);
        setMessages(thread);
    }, [teacherId]);

    useEffect(() => {
        void refresh().finally(() => setLoaded(true));
        const interval = setInterval(() => void refresh(), 20_000);
        return () => clearInterval(interval);
    }, [refresh]);

    const handleSend = async (body: string) => {
        const fd = new FormData();
        fd.set('body', body);
        const result = await import('@/app/actions/messages-actions').then((m) =>
            m.sendMessageToTeacher(fd)
        );
        await refresh();
        return result;
    };

    if (!teacherId || !user) {
        return (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Chat unavailable.
            </div>
        );
    }

    if (!loaded) {
        return <Skeleton className="h-[60vh] w-full rounded-lg" />;
    }

    return (
        <ChatThread
            messages={messages}
            meId={user.id}
            counterpartName="Maryam"
            onSend={(body) =>
                new Promise((resolve) => {
                    startTransition(() => {
                        void handleSend(body).then(resolve);
                    });
                })
            }
        />
    );
}
