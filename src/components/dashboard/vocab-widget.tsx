'use client';

import Link from 'next/link';
import { CheckCircle2, Flame } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatLocalizedNumber } from '@/lib/label-utils';
import { cn } from '@/lib/utils';
import type { VocabDashboardData } from '@/lib/types';

const content = {
    en: {
        streakCaption: 'day streak',
        todayLine: 'Today: {n} reviews',
        doneBadge: 'Done!',
        allCaughtUp: 'All caught up!',
        reviewCta: 'Review words',
        dueAria: 'Cards due for review',
    },
    de: {
        streakCaption: 'Tage-Serie',
        todayLine: 'Heute: {n} Wiederholungen',
        doneBadge: 'Fertig!',
        allCaughtUp: 'Alles erledigt!',
        reviewCta: 'Wörter üben',
        dueAria: 'Karten zur Wiederholung fällig',
    },
    fa: {
        streakCaption: 'روز پیوسته',
        todayLine: 'امروز: {n} مرور',
        doneBadge: 'تمام شد!',
        allCaughtUp: 'همه مرور شد!',
        reviewCta: 'مرور واژهها',
        dueAria: 'کارت‌های آماده مرور',
    },
} as const;

export function VocabWidget({ data }: { data: VocabDashboardData }) {
    const { language } = useLanguage();
    const t = content[language];

    // Nothing seeded at all (no decks, nothing due, no streak history):
    // an empty shell would just be noise on a fresh dashboard.
    const hasAnything =
        data.decks.length > 0 || data.dueTotal > 0 || data.streakDays > 0;
    if (!hasAnything) return null;

    const todayLine = t.todayLine.replace(
        '{n}',
        formatLocalizedNumber(data.reviewsToday, language)
    );

    return (
        <Card className="mb-6">
            <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Flame
                        aria-hidden="true"
                        className={cn(
                            'h-10 w-10 shrink-0',
                            data.streakDays > 0 ? 'text-orange-500' : 'text-muted-foreground'
                        )}
                    />
                    <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold leading-none">
                                {formatLocalizedNumber(data.streakDays, language)}
                            </span>
                            <span className="text-sm font-medium text-muted-foreground">
                                {t.streakCaption}
                            </span>
                        </div>
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            {data.studiedToday && (
                                <CheckCircle2
                                    aria-hidden="true"
                                    className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400"
                                />
                            )}
                            <span>{todayLine}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-start gap-3 sm:items-end">
                    <div className="flex items-center gap-3">
                        <span
                            aria-label={t.dueAria}
                            className={cn(
                                'flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold',
                                data.dueTotal > 0
                                    ? 'bg-destructive text-destructive-foreground'
                                    : 'bg-muted text-muted-foreground'
                            )}
                        >
                            {data.dueTotal > 0
                                ? formatLocalizedNumber(data.dueTotal, language)
                                : t.doneBadge}
                        </span>
                        {data.dueTotal === 0 && (
                            <span className="text-sm text-muted-foreground">{t.allCaughtUp}</span>
                        )}
                    </div>
                    <Button asChild disabled={data.dueTotal === 0}>
                        <Link href="/dashboard/vocab">{t.reviewCta}</Link>
                    </Button>
                </div>
            </CardContent>

            {data.decks.length > 0 && (
                <ul className="divide-y border-t px-6 py-2">
                    {data.decks.slice(0, 3).map(({ deck, dueCount }) => (
                        <li key={deck.id} className="flex items-center justify-between gap-3 py-2">
                            <span className="min-w-0 truncate text-sm font-medium">
                                {deck.title[language]}
                            </span>
                            <Badge variant={dueCount > 0 ? 'destructive' : 'secondary'}>
                                {formatLocalizedNumber(dueCount, language)}
                            </Badge>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}
