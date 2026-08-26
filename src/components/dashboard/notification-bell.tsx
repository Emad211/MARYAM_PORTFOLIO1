'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, ClipboardCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    getMyNotifications,
    getUnreadCount,
    markAllNotificationsRead,
} from '@/app/actions/notifications-actions';
import type { Language, NotificationItem } from '@/lib/types';
import { formatLocalizedDate } from '@/lib/label-utils';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

const UNREAD_POLL_MS = 60_000;

const bellContent = {
    en: {
        ariaBell: 'Notifications',
        empty: 'No notifications yet.',
        markAllRead: 'Mark all as read',
        submission_graded: 'Your submission was graded.',
        enrollment_decided: 'Enrollment update.',
        system: 'Notification.',
    },
    de: {
        ariaBell: 'Benachrichtigungen',
        empty: 'Noch keine Benachrichtigungen.',
        markAllRead: 'Alle als gelesen markieren',
        submission_graded: 'Ihre Abgabe wurde bewertet.',
        enrollment_decided: 'Update zu Ihrer Anmeldung.',
        system: 'Mitteilung.',
    },
    fa: {
        ariaBell: 'اعلانها',
        empty: 'فعلا اعلانی ندارید.',
        markAllRead: 'خواندن همه',
        submission_graded: 'پاسخ شما تصحیح شد.',
        enrollment_decided: 'وضعیت ثبت‌نام شما بهروزرسانی شد.',
        system: 'اعلان',
    },
} as const;

const TYPE_ICONS = {
    submission_graded: CheckCheck,
    enrollment_decided: ClipboardCheck,
    system: Info,
} as const;

function getRowText(item: NotificationItem, language: Language): string {
    const preview = item.payload?.preview;
    if (typeof preview === 'string') return preview;
    return bellContent[language][item.type];
}

export function NotificationBell() {
    const { language } = useLanguage();
    const t = bellContent[language];

    const [unreadCount, setUnreadCount] = useState(0);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [marking, setMarking] = useState(false);
    const [open, setOpen] = useState(false);

    // Every fetch is silent-fail-to-zero: a missing table or a dropped
    // request must never break the dashboard shell render.
    const refreshUnread = useCallback(async () => {
        try {
            const count = await getUnreadCount();
            setUnreadCount(typeof count === 'number' ? count : 0);
        } catch {
            setUnreadCount(0);
        }
    }, []);

    const refreshItems = useCallback(async () => {
        setLoadingItems(true);
        try {
            const data = await getMyNotifications();
            setItems(Array.isArray(data) ? data : []);
        } catch {
            setItems([]);
        } finally {
            setLoadingItems(false);
        }
    }, []);

    useEffect(() => {
        void refreshUnread();
        const timer = setInterval(() => {
            void refreshUnread();
        }, UNREAD_POLL_MS);
        return () => clearInterval(timer);
    }, [refreshUnread]);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) void refreshItems();
    };

    const handleMarkAllRead = async () => {
        if (marking) return;
        setMarking(true);
        try {
            await markAllNotificationsRead();
        } catch {
            // Silent — the refetch below reconciles the UI either way.
        } finally {
            setMarking(false);
        }
        await Promise.all([refreshUnread(), refreshItems()]);
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative" aria-label={t.ariaBell}>
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 ? (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -end-1 h-4 min-w-4 px-1 text-[10px]"
                        >
                            {unreadCount}
                        </Badge>
                    ) : null}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-3">
                {!loadingItems && items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">{t.empty}</p>
                ) : (
                    <ul className="-mx-2 max-h-72 space-y-1 overflow-y-auto">
                        {items.map((item) => {
                            const Icon = TYPE_ICONS[item.type];
                            return (
                                <li
                                    key={item.id}
                                    className={cn(
                                        'flex items-start gap-2 rounded-md px-2 py-2',
                                        !item.read && 'bg-muted/50'
                                    )}
                                >
                                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <p className="min-w-0 flex-1 text-sm leading-snug">
                                        {getRowText(item, language)}
                                    </p>
                                    <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">
                                        {formatLocalizedDate(item.createdAt, language)}
                                    </span>
                                    {!item.read ? (
                                        <span
                                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                )}
                {unreadCount > 0 ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full"
                        disabled={marking}
                        onClick={() => {
                            void handleMarkAllRead();
                        }}
                    >
                        {t.markAllRead}
                    </Button>
                ) : null}
            </PopoverContent>
        </Popover>
    );
}
