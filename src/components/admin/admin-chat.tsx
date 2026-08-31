'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getThreadWithUser, sendAdminMessage } from '@/app/actions/messages-actions';
import { ChatThread } from '@/components/dashboard/chat-thread';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/language-context';
import type { ChatMessage } from '@/lib/types';

const content = {
    en: { back: 'Back to inbox' },
    de: { back: 'Zurück zum Posteingang' },
    fa: { back: 'بازگشت به صندوق' },
} as const;

/**
 * Teacher side of a conversation with one student.
 * Polls every 20s so new student messages appear without reload.
 */
export function AdminChat({
    adminId,
    counterpartId,
    counterpartName,
}: {
    adminId: string;
    counterpartId: string;
    counterpartName: string;
}) {
    const { language } = useLanguage();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loaded, setLoaded] = useState(false);

    const refresh = useCallback(async () => {
        const thread = await getThreadWithUser(counterpartId);
        setMessages(thread);
    }, [counterpartId]);

    useEffect(() => {
        void refresh().finally(() => setLoaded(true));
        const interval = setInterval(() => void refresh(), 20_000);
        return () => clearInterval(interval);
    }, [refresh]);

    const handleSend = async (body: string) => {
        const fd = new FormData();
        fd.set('recipientId', counterpartId);
        fd.set('body', body);
        const result = await sendAdminMessage(fd);
        await refresh();
        return result;
    };

    if (!loaded) {
        return <Skeleton className="h-[60vh] w-full rounded-lg" />;
    }

    return (
        <div className="space-y-4">
            <Link
                href="/admin/inbox"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {content[language].back}
            </Link>
            <ChatThread
                messages={messages}
                meId={adminId}
                counterpartName={counterpartName}
                onSend={handleSend}
            />
        </div>
    );
}
