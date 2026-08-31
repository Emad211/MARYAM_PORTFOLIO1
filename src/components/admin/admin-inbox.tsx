'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/admin/empty-state';
import { formatLocalizedDate } from '@/lib/label-utils';
import { useLanguage } from '@/context/language-context';
import type { ConversationSummary } from '@/lib/types';

const content = {
    en: {
        title: 'Chat',
        subtitle: 'Private conversations with your students.',
        empty: 'No conversations yet',
        emptySub: 'When a student messages you, it will appear here.',
        unread: 'unread',
    },
    de: {
        title: 'Chat',
        subtitle: 'Private Gespräche mit Ihren Studierenden.',
        empty: 'Noch keine Gespräche',
        emptySub: 'Wenn Studierende Ihnen schreiben, erscheint es hier.',
        unread: 'ungelesen',
    },
    fa: {
        title: 'گفتگو',
        subtitle: 'گفتگوهای خصوصی با هنرجویان.',
        empty: 'هنوز گفتگویی شروع نشده',
        emptySub: 'وقتی هنرجو پیام بدهد اینجا می‌بینی.',
        unread: 'نخوانده',
    },
} as const;

export function AdminInbox({ conversations }: { conversations: ConversationSummary[] }) {
    const { language } = useLanguage();
    const t = content[language];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            {conversations.length === 0 ? (
                <EmptyState
                    icon={MessageCircle}
                    en={content.en.empty}
                    de={content.de.empty}
                    fa={content.fa.empty}
                    subEn={content.en.emptySub}
                    subDe={content.de.emptySub}
                    subFa={content.fa.emptySub}
                />
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
