'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { formatLocalizedDate } from '@/lib/label-utils';
import { cn } from '@/lib/utils';
import type { HomeworkItem } from '@/lib/types';

const content = {
    en: {
        title: 'Upcoming homework',
        overdue: 'Overdue',
        done: 'Done',
        doIt: 'Start lesson',
        empty: 'No homework right now 🎉',
    },
    de: {
        title: 'Anstehende Hausaufgaben',
        overdue: 'Überfällig',
        done: 'Erledigt',
        doIt: 'Lektion starten',
        empty: 'Gerade keine Hausaufgaben 🎉',
    },
    fa: {
        title: 'تکالیف پیش رو',
        overdue: 'مهلت گذشته',
        done: 'انجام شد',
        doIt: 'انجام درس',
        empty: 'فعلاً تکلیفی نیست 🎉',
    },
} as const;

export function HomeworkList({
    items,
    lessonSlug,
}: {
    items: HomeworkItem[];
    lessonSlug: Record<string, string>;
}) {
    const { language } = useLanguage();
    const t = content[language];
    if (items.length === 0) return null;

    const sorted = [...items].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    const now = Date.now();

    return (
        <Card className="mb-6">
            <CardContent className="space-y-2 pt-6">
                <h2 className="font-headline text-xl font-semibold">{t.title}</h2>
                <ul className="space-y-2">
                    {sorted.map((hw) => {
                        const slug = lessonSlug[hw.lessonId] ?? hw.classSlug;
                        const overdue = !hw.done && new Date(hw.dueAt).getTime() < now;
                        return (
                            <li
                                key={hw.id}
                                className={cn(
                                    'flex flex-wrap items-center justify-between gap-3 rounded-md border p-3',
                                    hw.done && 'opacity-60'
                                )}
                            >
                                <div className="min-w-0 space-y-0.5">
                                    <p className={cn('font-medium', hw.done && 'line-through')}>
                                        {hw.lesson.title[language]}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatLocalizedDate(hw.dueAt, language)}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    {hw.done ? (
                                        <Badge variant="outline" className="border-emerald-500/60 text-emerald-700 dark:text-emerald-400">
                                            ✓ {t.done}
                                        </Badge>
                                    ) : overdue ? (
                                        <Badge variant="destructive">{t.overdue}</Badge>
                                    ) : null}
                                    <Link
                                        href={`/classes/${slug}/lessons/${hw.lessonId}`}
                                        className="text-sm underline underline-offset-4 hover:text-primary"
                                    >
                                        {t.doIt} →
                                    </Link>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}
