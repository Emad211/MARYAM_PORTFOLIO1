'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { saveAttendance } from '@/app/actions/sessions-admin-actions';
import type { AttendanceStatus, RosterEntry } from '@/lib/types';

const OPTIONS: Array<{ value: AttendanceStatus; label: string }> = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'excused', label: 'Excused' },
    { value: 'pending', label: 'Not marked' },
];

export function AttendanceRoster({
    sessionId,
    roster,
}: {
    sessionId: string;
    roster: RosterEntry[];
}) {
    const { toast } = useToast();
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
                toast({ description: 'Attendance saved.' });
            } else {
                toast({ variant: 'destructive', description: 'Could not save attendance.' });
            }
        });
    };

    if (roster.length === 0) {
        return (
            <p className="px-2 py-3 text-sm text-muted-foreground">
                No approved students for this class yet.
            </p>
        );
    }

    return (
        <div className="space-y-3 px-2 py-1">
            <ul className="space-y-2">
                {roster.map((entry) => (
                    <li key={entry.userId} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">{entry.name}</span>
                        <div className="flex flex-wrap gap-3 text-xs">
                            {OPTIONS.map((option) => (
                                <label key={option.value} className="inline-flex cursor-pointer items-center gap-1">
                                    <input
                                        type="radio"
                                        name={`att-${sessionId}-${entry.userId}`}
                                        checked={(statuses[entry.userId] ?? entry.attendance) === option.value}
                                        onChange={() =>
                                            setStatuses((prev) => ({
                                                ...prev,
                                                [entry.userId]: option.value,
                                            }))
                                        }
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
                Save attendance
            </Button>
        </div>
    );
}
