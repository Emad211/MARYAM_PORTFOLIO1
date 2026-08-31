'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import {
    deleteLiveSession,
    upsertLiveSession,
    getRoster,
} from '@/app/actions/sessions-admin-actions';
import { AttendanceRoster } from '@/components/admin/attendance-roster';
import type { Class, LiveSession, RosterEntry } from '@/lib/types';

type SessionNode = LiveSession;

const content = {
    en: {
        prev: 'Previous week',
        today: 'This week',
        next: 'Next week',
        addSession: 'Add session',
        edit: 'Edit',
        delete: 'Delete',
        attendance: 'Attendance',
        class: 'Class',
        titleEn: 'Title EN',
        titleDe: 'Title DE',
        titleFa: 'Title FA (required)',
        start: 'Starts at',
        duration: 'Duration (min)',
        url: 'Meeting URL (optional)',
        notes: 'Private notes',
        save: 'Save session',
        creating: 'Saving…',
        saved: 'Session saved.',
        deleted: 'Session deleted.',
        conflict: 'Time conflict with another session!',
        deleteConfirm: 'Delete this session?',
        rosterLoading: 'Loading roster…',
        moveHint: 'Drag a session card onto another day to move it.',
    },
    de: {
        prev: 'Vorherige Woche',
        today: 'Diese Woche',
        next: 'Nächste Woche',
        addSession: 'Termin hinzufügen',
        edit: 'Bearbeiten',
        delete: 'Löschen',
        attendance: 'Anwesenheit',
        class: 'Kurs',
        titleEn: 'Titel EN',
        titleDe: 'Titel DE',
        titleFa: 'Titel FA (erforderlich)',
        start: 'Beginn',
        duration: 'Dauer (Min.)',
        url: 'Meeting-URL (optional)',
        notes: 'Private Notizen',
        save: 'Termin speichern',
        creating: 'Speichern…',
        saved: 'Termin gespeichert.',
        deleted: 'Termin gelöscht.',
        conflict: 'Zeitkonflikt mit einem anderen Termin!',
        deleteConfirm: 'Diesen Termin löschen?',
        rosterLoading: 'Liste wird geladen…',
        moveHint: 'Ziehen Sie eine Karte auf einen anderen Tag, um sie zu verschieben.',
    },
    fa: {
        prev: 'هفته قبل',
        today: 'این هفته',
        next: 'هفته بعد',
        addSession: 'جلسه جدید',
        edit: 'ویرایش',
        delete: 'حذف',
        attendance: 'حضور و غیاب',
        class: 'کلاس',
        titleEn: 'عنوان EN',
        titleDe: 'عنوان DE',
        titleFa: 'عنوان FA (الزامی)',
        start: 'زمان شروع',
        duration: 'مدت (دقیقه)',
        url: 'لینک جلسه (اختیاری)',
        notes: 'یادداشت خصوصی',
        save: 'ذخیره جلسه',
        creating: 'در حال ذخیره…',
        saved: 'جلسه ذخیره شد.',
        deleted: 'جلسه حذف شد.',
        conflict: 'تداخل زمانی با جلسه دیگر!',
        deleteConfirm: 'این جلسه حذف شود؟',
        rosterLoading: 'در حال بارگذاری لیست…',
        moveHint: 'کارت جلسه را بکشید و روی روز دیگری رها کنید.',
    },
} as const;

const inputClass =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm';

function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = (d.getDay() + 1) % 7; // Saturday = 0 (Iranian week start)
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
}

function dayKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toLocalInput(iso: string): string {
    const d = new Date(iso);
    return `${dayKey(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function ScheduleCalendar({
    classes,
    sessions,
}: {
    classes: Class[];
    sessions: SessionNode[];
}) {
    const router = useRouter();
    const { toast } = useToast();
    const { language } = useLanguage();
    const t = content[language];
    const [isPending, startTransition] = useTransition();
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
    const [editing, setEditing] = useState<SessionNode | 'new' | null>(null);
    const [editDate, setEditDate] = useState<string>(dayKey(new Date()));
    const [rosters, setRosters] = useState<Record<string, RosterEntry[]>>({});
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [dragId, setDragId] = useState<string | null>(null);

    const locale = language === 'fa' ? 'fa-IR' : language;

    const days = useMemo(
        () =>
            Array.from(
                { length: 7 },
                (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)
            ),
        [weekStart]
    );

    const byDay = useMemo(() => {
        const map: Record<string, SessionNode[]> = {};
        for (const s of sessions) {
            const key = dayKey(new Date(s.startsAt));
            (map[key] ??= []).push(s);
        }
        for (const list of Object.values(map)) list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        return map;
    }, [sessions]);

    const openEditor = (session: SessionNode | 'new', dateISO?: string) => {
        setEditing(session);
        if (dateISO) setEditDate(dateISO);
        else if (session === 'new') setEditDate(dayKey(new Date()));
        else setEditDate(dayKey(new Date(session.startsAt)));
    };

    const report = (ok: boolean, msg: string, conflict = false) => {
        toast(
            ok
                ? { description: msg }
                : { variant: 'destructive', description: conflict ? t.conflict : msg }
        );
    };

    const moveSession = (session: SessionNode, targetDay: string) => {
        const old = new Date(session.startsAt);
        const [y, m, d] = targetDay.split('-').map(Number);
        const next = new Date(
            y ?? old.getFullYear(),
            (m ?? 1) - 1,
            d ?? old.getDate(),
            old.getHours(),
            old.getMinutes()
        );
        startTransition(async () => {
            const fd = new FormData();
            fd.set('id', session.id);
            fd.set('classSlug', session.classSlug);
            fd.set('titleFa', session.title.fa);
            fd.set('titleEn', session.title.en);
            fd.set('titleDe', session.title.de);
            fd.set('startsAtLocal', toLocalInput(next.toISOString()));
            fd.set('durationMin', String(session.durationMin));
            if (session.meetingUrl) fd.set('meetingUrl', session.meetingUrl);
            if (session.notes) fd.set('notes', session.notes);
            const result = await upsertLiveSession(fd);
            if (result.success) {
                report(true, t.saved);
                router.refresh();
            } else {
                report(false, result.message, result.message === 'conflict');
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setWeekStart(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7))
                        }
                    >
                        ← {t.prev}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
                        {t.today}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setWeekStart(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7))
                        }
                    >
                        {t.next} →
                    </Button>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground md:inline">{t.moveHint}</span>
                    <Button size="sm" onClick={() => openEditor('new')}>
                        + {t.addSession}
                    </Button>
                </div>
            </div>

            {editing && (
                <Card>
                    <CardContent className="pt-6">
                        <form
                            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                if (editing !== 'new') fd.set('id', editing.id);
                                startTransition(async () => {
                                    const result = await upsertLiveSession(fd);
                                    if (result.success) {
                                        report(true, t.saved);
                                        setEditing(null);
                                        router.refresh();
                                    } else {
                                        report(false, result.message, result.message === 'conflict');
                                    }
                                });
                            }}
                        >
                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="sc-class">{t.class}</Label>
                                <select
                                    id="sc-class"
                                    name="classSlug"
                                    required
                                    className={inputClass}
                                    defaultValue={editing !== 'new' ? editing.classSlug : ''}
                                >
                                    {classes.map((c) => (
                                        <option key={c.slug} value={c.slug}>
                                            {c.title.fa || c.title.en} ({c.slug})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="sc-start">{t.start}</Label>
                                <Input
                                    id="sc-start"
                                    name="startsAtLocal"
                                    type="datetime-local"
                                    required
                                    defaultValue={
                                        editing !== 'new'
                                            ? toLocalInput(editing.startsAt)
                                            : `${editDate}T18:00`
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sc-dur">{t.duration}</Label>
                                <Input
                                    id="sc-dur"
                                    name="durationMin"
                                    type="number"
                                    min={10}
                                    max={480}
                                    defaultValue={editing !== 'new' ? editing.durationMin : 60}
                                />
                            </div>
                            <div className="space-y-1 sm:col-span-3">
                                <Label htmlFor="sc-url">{t.url}</Label>
                                <Input
                                    id="sc-url"
                                    name="meetingUrl"
                                    type="url"
                                    defaultValue={editing !== 'new' ? (editing.meetingUrl ?? '') : ''}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sc-ten">{t.titleEn}</Label>
                                <Input id="sc-ten" name="titleEn" defaultValue={editing !== 'new' ? editing.title.en : ''} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sc-tde">{t.titleDe}</Label>
                                <Input id="sc-tde" name="titleDe" defaultValue={editing !== 'new' ? editing.title.de : ''} />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="sc-tfa">{t.titleFa}</Label>
                                <Input id="sc-tfa" name="titleFa" required defaultValue={editing !== 'new' ? editing.title.fa : ''} />
                            </div>
                            <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                                <Label htmlFor="sc-notes">{t.notes}</Label>
                                <Input id="sc-notes" name="notes" maxLength={5000} defaultValue={editing !== 'new' ? (editing.notes ?? '') : ''} />
                            </div>
                            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? t.creating : t.save}
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                                    ✕
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-2">
                {days.map((day) => {
                    const key = dayKey(day);
                    const list = byDay[key] ?? [];
                    const isToday = key === dayKey(new Date());
                    return (
                        <div
                            key={key}
                            className={`min-w-[9rem] space-y-2 rounded-lg border p-2 ${isToday ? 'border-primary/50 bg-primary/5' : ''}`}
                            onDragOver={(e) => {
                                if (dragId) e.preventDefault();
                            }}
                            onDrop={() => {
                                const s = sessions.find((x) => x.id === dragId);
                                setDragId(null);
                                if (s && dayKey(new Date(s.startsAt)) !== key) moveSession(s, key);
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {day.toLocaleDateString(locale, { weekday: 'short' })}
                                </span>
                                <span className="text-xs tabular-nums text-muted-foreground">
                                    {day.toLocaleDateString(locale, { day: 'numeric' })}
                                </span>
                            </div>
                            {list.map((s) => (
                                <div
                                    key={s.id}
                                    draggable
                                    onDragStart={() => setDragId(s.id)}
                                    onDragEnd={() => setDragId(null)}
                                    className="cursor-move space-y-1 rounded-md border bg-card p-2 text-xs shadow-sm hover:bg-muted/50"
                                >
                                    <p className="font-semibold tabular-nums">
                                        {new Date(s.startsAt).toLocaleTimeString(locale, {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                    <p className="truncate">{s.title.fa || s.title.en}</p>
                                    <Badge variant="secondary" className="max-w-full truncate">
                                        {s.classSlug}
                                    </Badge>
                                    <div className="flex flex-wrap gap-1">
                                        <button type="button" className="text-[10px] underline" onClick={() => openEditor(s)}>
                                            {t.edit}
                                        </button>
                                        <button
                                            type="button"
                                            className="text-[10px] underline"
                                            onClick={() => {
                                                setExpanded((p) => ({ ...p, [s.id]: !p[s.id] }));
                                                if (!rosters[s.id])
                                                    void getRoster(s.id).then((entries) =>
                                                        setRosters((p) => ({ ...p, [s.id]: entries }))
                                                    );
                                            }}
                                        >
                                            {t.attendance}
                                        </button>
                                        <button
                                            type="button"
                                            className="text-[10px] text-destructive underline"
                                            onClick={() => {
                                                if (!window.confirm(t.deleteConfirm)) return;
                                                startTransition(async () => {
                                                    const fd = new FormData();
                                                    fd.set('id', s.id);
                                                    const result = await deleteLiveSession(fd);
                                                    if (result.success) {
                                                        toast({ description: t.deleted });
                                                        router.refresh();
                                                    }
                                                });
                                            }}
                                        >
                                            {t.delete}
                                        </button>
                                    </div>
                                    {expanded[s.id] && (
                                        <div className="mt-1 border-t pt-1">
                                            {(() => {
                                                const roster = rosters[s.id];
                                                return roster ? (
                                                    <AttendanceRoster sessionId={s.id} roster={roster} />
                                                ) : (
                                                    <p className="text-muted-foreground">{t.rosterLoading}</p>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                className="w-full rounded-md border border-dashed py-1 text-[10px] text-muted-foreground hover:text-foreground"
                                onClick={() => openEditor('new', key)}
                            >
                                +
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
