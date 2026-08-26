'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatLocalizedDate } from '@/lib/label-utils';
import { useLanguage } from '@/context/language-context';
import type { ConversationSummary } from '@/lib/types';

const content = {
    en: { title: 'Inbox', empty: 'No conversations yet.', unread: 'unread' },
    de: { title: 'Posteingang', empty: 'Noch keine Gespräche.', unread: 'ungelesen' },
    fa: { title: 'صندوق ورودی', empty: 'هنوز گفتگویی نیست.', unread: 'نخوانده' },
} as const;

export function AdminInbox({ conversations }: { conversations: ConversationSummary[] }) {
    const { language } = useLanguage();
    const t = content[language];

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>

            {conversations.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    {t.empty}
                </div>
            ) : (
                <div className="space-y-2">
                    {conversations.map((conversation) => (
                        <Link key={conversation.counterpartId} href={`/admin/inbox/${conversation.counterpartId}`}>
                            <Card className="transition-colors hover:bg-muted/40">
                                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                                    <div className="min-w-0 space-y-0.5">
                                        <p className="font-medium">{conversation.counterpartName}</p>
                                        <p className="truncate text-sm text-muted-foreground">
                                            {conversation.lastMessagePreview}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {conversation.unreadCount > 0 && (
                                            <Badge variant="destructive">
                                                {conversation.unreadCount} {t.unread}
                                            </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                            {formatLocalizedDate(conversation.lastMessageAt, language)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
