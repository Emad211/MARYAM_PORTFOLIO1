'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { formatLocalizedDate } from '@/lib/label-utils';
import { EmptyState } from '@/components/admin/empty-state';
import {
    deleteLiveSession,
    getRoster,
    upsertLiveSession,
} from '@/app/actions/sessions-admin-actions';
import { AttendanceRoster } from '@/components/admin/attendance-roster';
import type { Class, LiveSession, RosterEntry } from '@/lib/types';

type SessionNode = LiveSession;

const inputClass =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm';

const INTL_LOCALE = { en: 'en-US', de: 'de-DE', fa: 'fa-IR' } as const;

const ui = {
    en: {
        title: 'Sessions',
        subtitle:
            'Schedule live teaching sessions per class. Approved students are notified automatically.',
        sessionCount: (n: number) => `${n} session${n === 1 ? '' : 's'}.`,
        newSession: '+ New session',
        close: 'Close',
        classLabel: 'Class',
        startsAt: 'Starts at',
        durationMin: 'Duration (min)',
        meetingUrl: 'Meeting URL (optional)',
        titleEn: 'Title EN',
        titleDe: 'Title DE',
        titleFa: 'Title FA (required)',
        scheduleAction: 'Schedule session',
        scheduledToast: 'Session scheduled. Students notified.',
        attendanceShow: 'Attendance',
        attendanceHide: 'Hide attendance',
        delete: 'Delete',
        confirmDelete: 'Delete this session?',
        deletedToast: 'Deleted.',
        deleteFailed: 'Delete failed.',
        loadingRoster: 'Loading roster…',
        hasMeetingLink: 'has meeting link',
        minUnit: 'min',
        empty: 'No sessions scheduled yet',
        emptySub: 'Schedule the first session with the “New session” button.',
    },
    de: {
        title: 'Termine',
        subtitle:
            'Planen Sie Live-Sitzungen pro Kurs. Angenommene Studierende werden automatisch benachrichtigt.',
        sessionCount: (n: number) => `${n} Termin${n === 1 ? '' : 'e'}.`,
        newSession: '+ Neue Sitzung',
        close: 'Schließen',
        classLabel: 'Kurs',
        startsAt: 'Beginnt um',
        durationMin: 'Dauer (Min.)',
        meetingUrl: 'Meeting-URL (optional)',
        titleEn: 'Titel EN',
        titleDe: 'Titel DE',
        titleFa: 'Titel FA (erforderlich)',
        scheduleAction: 'Sitzung anlegen',
        scheduledToast: 'Sitzung angelegt. Studierende benachrichtigt.',
        attendanceShow: 'Anwesenheit',
        attendanceHide: 'Anwesenheit ausblenden',
        delete: 'Löschen',
        confirmDelete: 'Diese Sitzung löschen?',
        deletedToast: 'Gelöscht.',
        deleteFailed: 'Löschen fehlgeschlagen.',
        loadingRoster: 'Teilnehmerliste wird geladen…',
        hasMeetingLink: 'Meeting-Link vorhanden',
        minUnit: 'Min.',
        empty: 'Noch keine Termine geplant',
        emptySub: 'Legen Sie die erste Sitzung mit der Schaltfläche „Neue Sitzung“ an.',
    },
    fa: {
        title: 'جلسات',
        subtitle:
            'برنامه‌ریزی جلسات زندهٔ آموزشی برای هر کلاس. به هنرجویان تأییدشده به‌طور خودکار اطلاع داده می‌شود.',
        sessionCount: (n: number) => `${n} جلسه.`,
        newSession: '+ جلسهٔ جدید',
        close: 'بستن',
        classLabel: 'کلاس',
        startsAt: 'زمان شروع',
        durationMin: 'مدت (دقیقه)',
        meetingUrl: 'لینک جلسه (اختیاری)',
        titleEn: 'عنوان انگلیسی',
        titleDe: 'عنوان آلمانی',
        titleFa: 'عنوان فارسی (الزامی)',
        scheduleAction: 'ثبت جلسه',
        scheduledToast: 'جلسه ثبت شد. به هنرجویان اطلاع داده شد.',
        attendanceShow: 'حضور و غیاب',
        attendanceHide: 'بستن حضور و غیاب',
        delete: 'حذف',
        confirmDelete: 'این جلسه حذف شود؟',
        deletedToast: 'حذف شد.',
        deleteFailed: 'حذف ناموفق بود.',
        loadingRoster: 'در حال بارگذاری فهرست حضور…',
        hasMeetingLink: 'لینک جلسه دارد',
        minUnit: 'دقیقه',
        empty: 'هنوز جلسه‌ای برنامه‌ریزی نشده است',
        emptySub: 'اولین جلسه را با دکمهٔ «جلسهٔ جدید» ثبت کنید.',
    },
} as const;

export function SessionScheduler({
    classes,
    sessions,
}: {
    classes: Class[];
    sessions: SessionNode[];
}) {
    const router = useRouter();
    const { toast } = useToast();
    const { language } = useLanguage();
    const t = ui[language];
    const [isPending, startTransition] = useTransition();
    const [showNew, setShowNew] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [rosters, setRosters] = useState<Record<string, RosterEntry[]>>({});

    const sessionTitle = (session: SessionNode) =>
        session.title[language] || session.title.fa || session.title.en;

    const loadRoster = (sessionId: string) => {
        setExpanded((prev) => ({ ...prev, [sessionId]: !prev[sessionId] }));
        if (!rosters[sessionId]) {
            void getRoster(sessionId).then((entries) =>
                setRosters((prev) => ({ ...prev, [sessionId]: entries }))
            );
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {t.sessionCount(sessions.length)}
                    </p>
                    <Button size="sm" onClick={() => setShowNew((v) => !v)} disabled={isPending}>
                        {showNew ? t.close : t.newSession}
                    </Button>
                </div>

                {showNew && (
                    <Card>
                        <CardContent className="pt-6">
                            <form
                                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const fd = new FormData(e.currentTarget);
                                    startTransition(async () => {
                                        const result = await upsertLiveSession(fd);
                                        if (result.success) {
                                            toast({ description: t.scheduledToast });
                                            setShowNew(false);
                                            router.refresh();
                                        } else {
                                            toast({ variant: 'destructive', description: result.message });
                                        }
                                    });
                                }}
                            >
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="ns-class">{t.classLabel}</Label>
                                    <select id="ns-class" name="classSlug" required className={inputClass}>
                                        {classes.map((c) => (
                                            <option key={c.slug} value={c.slug}>
                                                {c.title[language] || c.title.fa || c.title.en} ({c.slug})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="ns-start">{t.startsAt}</Label>
                                    <Input id="ns-start" name="startsAtLocal" type="datetime-local" required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="ns-dur">{t.durationMin}</Label>
                                    <Input
                                        id="ns-dur"
                                        name="durationMin"
                                        type="number"
                                        min={10}
                                        max={480}
                                        defaultValue={60}
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-3">
                                    <Label htmlFor="ns-url">{t.meetingUrl}</Label>
                                    <Input
                                        id="ns-url"
                                        name="meetingUrl"
                                        type="url"
                                        placeholder="https://meet.google.com/..."
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="ns-ten">{t.titleEn}</Label>
                                    <Input id="ns-ten" name="titleEn" />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor="ns-tde">{t.titleDe}</Label>
                                    <Input id="ns-tde" name="titleDe" />
                                </div>
                                <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                                    <Label htmlFor="ns-tfa">{t.titleFa}</Label>
                                    <Input id="ns-tfa" name="titleFa" required />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-4">
                                    <Button type="submit" disabled={isPending}>
                                        {t.scheduleAction}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {sessions.length === 0 ? (
                    <EmptyState
                        icon={CalendarDays}
                        en={ui.en.empty}
                        de={ui.de.empty}
                        fa={ui.fa.empty}
                        subEn={ui.en.emptySub}
                        subDe={ui.de.emptySub}
                        subFa={ui.fa.emptySub}
                    />
                ) : (
                    <div className="space-y-2">
                        {sessions.map((session) => (
                            <Card key={session.id}>
                                <CardContent className="p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="min-w-0 space-y-0.5">
                                            <p className="font-medium">
                                                {formatLocalizedDate(session.startsAt, language)} ·{' '}
                                                {new Date(session.startsAt).toLocaleTimeString(
                                                    INTL_LOCALE[language],
                                                    {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    }
                                                )}{' '}
                                                — {sessionTitle(session)}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="secondary">{session.classSlug}</Badge>
                                                <span>
                                                    {session.durationMin} {t.minUnit}
                                                </span>
                                                {session.meetingUrl && <span>{t.hasMeetingLink}</span>}
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => loadRoster(session.id)}>
                                                {expanded[session.id] ? t.attendanceHide : t.attendanceShow}
                                                {expanded[session.id] ? (
                                                    <ChevronDown className="ms-1 h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive"
                                                disabled={isPending}
                                                onClick={() => {
                                                    if (!window.confirm(t.confirmDelete)) return;
                                                    startTransition(async () => {
                                                        const fd = new FormData();
                                                        fd.set('id', session.id);
                                                        const result = await deleteLiveSession(fd);
                                                        if (result.success) {
                                                            toast({ description: t.deletedToast });
                                                            router.refresh();
                                                        } else {
                                                            toast({ variant: 'destructive', description: t.deleteFailed });
                                                        }
                                                    });
                                                }}
                                            >
                                                {t.delete}
                                            </Button>
                                        </div>
                                    </div>

                                    {expanded[session.id] && (
                                        <div className="mt-3 border-t pt-3">
                                            {(() => {
                                                const roster = rosters[session.id];
                                                return roster ? (
                                                    <AttendanceRoster sessionId={session.id} roster={roster} />
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">{t.loadingRoster}</p>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
