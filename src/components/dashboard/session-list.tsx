'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatLocalizedDate } from '@/lib/label-utils';
import { useLanguage } from '@/context/language-context';
import type { AttendanceStatus, Class, SessionWithAttendance } from '@/lib/types';

const content = {
    en: {
        upcoming: 'Upcoming sessions',
        past: 'Past sessions',
        showPast: 'Show past sessions',
        hidePast: 'Hide past sessions',
        join: 'Join',
        min: 'min',
        emptyUpcoming: 'No upcoming sessions scheduled yet.',
        emptyPast: 'No past sessions.',
        attendance: {
            present: 'Present',
            absent: 'Absent',
            excused: 'Excused',
            pending: 'Not marked',
        } as Record<AttendanceStatus, string>,
    },
    de: {
        upcoming: 'Anstehende Termine',
        past: 'Vergangene Termine',
        showPast: 'Vergangene anzeigen',
        hidePast: 'Ausblenden',
        join: 'Teilnehmen',
        min: 'Min.',
        emptyUpcoming: 'Noch keine Termine geplant.',
        emptyPast: 'Keine vergangenen Termine.',
        attendance: {
            present: 'Anwesend',
            absent: 'Abwesend',
            excused: 'Entschuldigt',
            pending: 'Nicht markiert',
        } as Record<AttendanceStatus, string>,
    },
    fa: {
        upcoming: 'جلسات پیش رو',
        past: 'جلسات گذشته',
        showPast: 'نمایش جلسات گذشته',
        hidePast: 'پنهان کردن',
        join: 'ورود به جلسه',
        min: 'دقیقه',
        emptyUpcoming: 'هنوز جلسهای برنامهریزی نشده است.',
        emptyPast: 'جلسه گذشتهای نیست.',
        attendance: {
            present: 'حاضر',
            absent: 'غایب',
            excused: 'معذور',
            pending: 'ثبت نشده',
        } as Record<AttendanceStatus, string>,
    },
} as const;

const ATT_BADGE: Record<AttendanceStatus, string> = {
    present: 'border-emerald-500/60 text-emerald-700 dark:text-emerald-400',
    absent: 'border-destructive/40 text-muted-foreground',
    excused: 'border-amber-500/60 text-amber-700 dark:text-amber-400',
    pending: 'border-border text-muted-foreground',
};

function timeText(iso: string, language: 'en' | 'de' | 'fa'): string {
    return new Date(iso).toLocaleTimeString(language === 'fa' ? 'fa-IR' : language, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function SessionList({
    upcoming,
    past,
    classes,
}: {
    upcoming: SessionWithAttendance[];
    past: SessionWithAttendance[];
    classes: Class[];
}) {
    const { language } = useLanguage();
    const t = content[language];
    const [showPast, setShowPast] = useState(false);

    const titleFor = (slug: string): string =>
        classes.find((c) => c.slug === slug)?.title[language] ?? slug;

    return (
        <div className="space-y-8">
            <section className="space-y-3">
                <h2 className="font-headline text-xl font-semibold">{t.upcoming}</h2>
                {upcoming.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                        {t.emptyUpcoming}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcoming.map((session) => (
                            <Card key={session.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <CardTitle className="text-base">{session.title[language]}</CardTitle>
                                        <Badge variant="secondary">{titleFor(session.classSlug)}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="space-y-0.5">
                                        <p className="font-medium">
                                            {formatLocalizedDate(session.startsAt, language)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {timeText(session.startsAt, language)} · {session.durationMin} {t.min}
                                        </p>
                                        {session.locationNote && (
                                            <p className="text-sm text-muted-foreground">
                                                {session.locationNote[language]}
                                            </p>
                                        )}
                                    </div>
                                    {session.meetingUrl && (
                                        <Button asChild size="sm">
                                            <Link href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                                                {t.join}
                                            </Link>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-headline text-xl font-semibold">{t.past}</h2>
                    <Button variant="ghost" size="sm" onClick={() => setShowPast((v) => !v)}>
                        {showPast ? t.hidePast : t.showPast}
                    </Button>
                </div>
                {showPast &&
                    (past.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t.emptyPast}</p>
                    ) : (
                        <ul className="space-y-2">
                            {[...past].reverse().map((session) => (
                                <li
                                    key={session.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                                >
                                    <div>
                                        <p className="font-medium">{session.title[language]}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatLocalizedDate(session.startsAt, language)} ·{' '}
                                            {timeText(session.startsAt, language)}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className={ATT_BADGE[session.attendance ?? 'pending']}>
                                        {t.attendance[session.attendance ?? 'pending']}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    ))}
            </section>
        </div>
    );
}
