'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { saveAttendance } from '@/app/actions/sessions-admin-actions';
import type { AttendanceStatus, RosterEntry } from '@/lib/types';

const ATTENDANCE_STATUSES: AttendanceStatus[] = ['present', 'absent', 'excused', 'pending'];

const ui = {
    en: {
        options: {
            present: 'Present',
            absent: 'Absent',
            excused: 'Excused',
            pending: 'Not marked',
        } as Record<AttendanceStatus, string>,
        save: 'Save attendance',
        savedToast: 'Attendance saved.',
        saveFailed: 'Could not save attendance.',
        empty: 'No approved students for this class yet.',
    },
    de: {
        options: {
            present: 'Anwesend',
            absent: 'Abwesend',
            excused: 'Entschuldigt',
            pending: 'Nicht markiert',
        } as Record<AttendanceStatus, string>,
        save: 'Anwesenheit speichern',
        savedToast: 'Anwesenheit gespeichert.',
        saveFailed: 'Anwesenheit konnte nicht gespeichert werden.',
        empty: 'Noch keine angenommenen Studierenden in diesem Kurs.',
    },
    fa: {
        options: {
            present: 'حاضر',
            absent: 'غایب',
            excused: 'معذور',
            pending: 'ثبت‌نشده',
        } as Record<AttendanceStatus, string>,
        save: 'ذخیره حضور و غیاب',
        savedToast: 'حضور و غیاب ذخیره شد.',
        saveFailed: 'ذخیرهٔ حضور و غیاب ممکن نشد.',
        empty: 'هنوز هنرجوی تأییدشده‌ای برای این کلاس وجود ندارد.',
    },
} as const;

export function AttendanceRoster({
    sessionId,
    roster,
}: {
    sessionId: string;
    roster: RosterEntry[];
}) {
    const { toast } = useToast();
    const { language } = useLanguage();
    const t = ui[language];
    const [isPending, startTransition] = useTransition();
    const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() =>
        Object.fromEntries(roster.map((entry) => [entry.userId, entry.attendance]))
    );

    const handleSave = () => {
        startTransition(async () => {
            const fd = new FormData();
            fd.set('sessionId', sessionId);
            fd.set(
                'entries',
                JSON.stringify(
                    roster.map((entry) => ({ userId: entry.userId, status: statuses[entry.userId] }))
                )
            );
            const result = await saveAttendance(fd);
            if (result.success) {
                toast({ description: t.savedToast });
            } else {
                toast({ variant: 'destructive', description: t.saveFailed });
            }
        });
    };

    if (roster.length === 0) {
        return (
            <p className="px-2 py-3 text-sm text-muted-foreground">{t.empty}</p>
        );
    }

    return (
        <div className="space-y-3 px-2 py-1">
            <ul className="space-y-2">
                {roster.map((entry) => (
                    <li key={entry.userId} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">{entry.name}</span>
                        <div className="flex flex-wrap gap-3 text-xs">
                            {ATTENDANCE_STATUSES.map((status) => (
                                <label key={status} className="inline-flex cursor-pointer items-center gap-1">
                                    <input
                                        type="radio"
                                        name={`att-${sessionId}-${entry.userId}`}
                                        checked={(statuses[entry.userId] ?? entry.attendance) === status}
                                        onChange={() =>
                                            setStatuses((prev) => ({
                                                ...prev,
                                                [entry.userId]: status,
                                            }))
                                        }
                                    />
                                    {t.options[status]}
                                </label>
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
                {t.save}
            </Button>
        </div>
    );
}
