'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatLocalizedDate } from '@/lib/label-utils';
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

export function SessionScheduler({
    classes,
    sessions,
}: {
    classes: Class[];
    sessions: SessionNode[];
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [showNew, setShowNew] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [rosters, setRosters] = useState<Record<string, RosterEntry[]>>({});

    const loadRoster = (sessionId: string) => {
        setExpanded((prev) => ({ ...prev, [sessionId]: !prev[sessionId] }));
        if (!rosters[sessionId]) {
            void getRoster(sessionId).then((entries) =>
                setRosters((prev) => ({ ...prev, [sessionId]: entries }))
            );
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{sessions.length} session(s).</p>
                <Button size="sm" onClick={() => setShowNew((v) => !v)} disabled={isPending}>
                    {showNew ? 'Close' : '+ New session'}
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
                                        toast({ description: 'Session scheduled. Students notified.' });
                                        setShowNew(false);
                                        router.refresh();
                                    } else {
                                        toast({ variant: 'destructive', description: result.message });
                                    }
                                });
                            }}
                        >
                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="ns-class">Class</Label>
                                <select id="ns-class" name="classSlug" required className={inputClass}>
                                    {classes.map((c) => (
                                        <option key={c.slug} value={c.slug}>
                                            {c.title.en} ({c.slug})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="ns-start">Starts at</Label>
                                <Input id="ns-start" name="startsAtLocal" type="datetime-local" required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="ns-dur">Duration (min)</Label>
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
                                <Label htmlFor="ns-url">Meeting URL (optional)</Label>
                                <Input
                                    id="ns-url"
                                    name="meetingUrl"
                                    type="url"
                                    placeholder="https://meet.google.com/..."
                                />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="ns-ten">Title EN</Label>
                                <Input id="ns-ten" name="titleEn" />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="ns-tde">Title DE</Label>
                                <Input id="ns-tde" name="titleDe" />
                            </div>
                            <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                                <Label htmlFor="ns-tfa">Title FA (required)</Label>
                                <Input id="ns-tfa" name="titleFa" required />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-4">
                                <Button type="submit" disabled={isPending}>
                                    Schedule session
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-2">
                {sessions.map((session) => (
                    <Card key={session.id}>
                        <CardContent className="p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="min-w-0 space-y-0.5">
                                    <p className="font-medium">
                                        {formatLocalizedDate(session.startsAt, 'en')} ·{' '}
                                        {new Date(session.startsAt).toLocaleTimeString('en', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}{' '}
                                        — {session.title.fa || session.title.en}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant="secondary">{session.classSlug}</Badge>
                                        <span>{session.durationMin} min</span>
                                        {session.meetingUrl && <span>has meeting link</span>}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => loadRoster(session.id)}>
                                        {expanded[session.id] ? 'Hide attendance' : 'Attendance'}
                                        {expanded[session.id] ? (
                                            <ChevronDown className="ms-1 h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="ms-1 h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        disabled={isPending}
                                        onClick={() => {
                                            if (!window.confirm('Delete this session?')) return;
                                            startTransition(async () => {
                                                const fd = new FormData();
                                                fd.set('id', session.id);
                                                const result = await deleteLiveSession(fd);
                                                if (result.success) {
                                                    toast({ description: 'Deleted.' });
                                                    router.refresh();
                                                } else {
                                                    toast({ variant: 'destructive', description: 'Delete failed.' });
                                                }
                                            });
                                        }}
                                    >
                                        Delete
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
                                            <p className="text-sm text-muted-foreground">Loading roster…</p>
                                        );
                                    })()}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
