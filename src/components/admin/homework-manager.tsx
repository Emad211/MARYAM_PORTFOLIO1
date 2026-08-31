'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { EmptyState } from '@/components/admin/empty-state';
import { BookOpenCheck } from 'lucide-react';
import {
    createHomeworkAssignment,
    deleteHomeworkAssignment,
} from '@/app/actions/homework-actions';

export interface HomeworkRow {
    id: string;
    classSlug: string;
    lessonId: string;
    dueAt: string;
    createdAt: string;
    lessonTitleFa: string;
    assignedCount: number;
    doneCount: number;
}

const content = {
    en: {
        create: 'Assign homework',
        class: 'Class',
        lesson: 'Lesson',
        due: 'Due at',
        save: 'Assign & notify',
        saved: 'Homework assigned — students notified.',
        deleteConfirm: 'Delete this homework?',
        deleted: 'Homework deleted.',
        count: 'homework item(s)',
        progress: (done: number, total: number) => `${done} of ${total} done`,
        empty: 'No homework yet',
        emptySub: 'Assign a lesson with a due date; approved students get notified automatically.',
    },
    de: {
        create: 'Hausaufgabe stellen',
        class: 'Kurs',
        lesson: 'Lektion',
        due: 'Fällig am',
        save: 'Zuweisen & benachrichtigen',
        saved: 'Hausaufgabe gestellt — Lernende benachrichtigt.',
        deleteConfirm: 'Diese Hausaufgabe löschen?',
        deleted: 'Hausaufgabe gelöscht.',
        count: 'Hausaufgabe(n)',
        progress: (done: number, total: number) => `${done} von ${total} erledigt`,
        empty: 'Noch keine Hausaufgaben',
        emptySub: 'Weisen Sie eine Lektion mit Fälligkeitsdatum zu; zugelassene Lernende werden automatisch benachrichtigt.',
    },
    fa: {
        create: 'ثبت تکلیف',
        class: 'کلاس',
        lesson: 'درس',
        due: 'مهلت انجام',
        save: 'ثبت و اطلاعرسانی',
        saved: 'تکلیف ثبت شد و به هنرجویان اطلاع داده شد.',
        deleteConfirm: 'این تکلیف حذف شود؟',
        deleted: 'تکلیف حذف شد.',
        count: 'تکلیف',
        progress: (done: number, total: number) => `${done} از ${total} انجام شد`,
        empty: 'هنوز تکلیفی ثبت نشده',
        emptySub: 'یک درس با مهلت انتخاب کن؛ هنرجویان تأییدشده خودکار خبردار میشوند.',
    },
} as const;

const inputClass =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm';

export function HomeworkManager({
    initialHomework,
    lessonsByClass,
}: {
    initialHomework: HomeworkRow[];
    lessonsByClass: Record<string, Array<{ id: string; titleFa: string }>>;
}) {
    const router = useRouter();
    const { toast } = useToast();
    const { language } = useLanguage();
    const t = content[language];
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [classSlug, setClassSlug] = useState<string>(
        () => Object.keys(lessonsByClass)[0] ?? ''
    );

    const lessons = lessonsByClass[classSlug] ?? [];
    const locale = language === 'fa' ? 'fa-IR' : language;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {initialHomework.length} {t.count}
                </p>
                <Button size="sm" onClick={() => setShowForm((v) => !v)} disabled={isPending}>
                    {showForm ? '✕' : `+ ${t.create}`}
                </Button>
            </div>

            {showForm && (
                <Card>
                    <CardContent className="pt-6">
                        <form
                            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                startTransition(async () => {
                                    const result = await createHomeworkAssignment(fd);
                                    if (result.success) {
                                        toast({ description: t.saved });
                                        setShowForm(false);
                                        router.refresh();
                                    } else {
                                        toast({ variant: 'destructive', description: result.message });
                                    }
                                });
                            }}
                        >
                            <div className="space-y-1">
                                <Label htmlFor="hw-class">{t.class}</Label>
                                <select
                                    id="hw-class"
                                    name="classSlug"
                                    required
                                    className={inputClass}
                                    value={classSlug}
                                    onChange={(e) => setClassSlug(e.target.value)}
                                >
                                    {Object.keys(lessonsByClass).map((slug) => (
                                        <option key={slug} value={slug}>
                                            {slug}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="hw-lesson">{t.lesson}</Label>
                                <select id="hw-lesson" name="lessonId" required className={inputClass}>
                                    {lessons.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.titleFa}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="hw-due">{t.due}</Label>
                                <Input id="hw-due" name="dueAtLocal" type="datetime-local" required />
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" disabled={isPending}>
                                    {t.save}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {initialHomework.length === 0 ? (
                <EmptyState
                    icon={BookOpenCheck}
                    fa={t.empty}
                    en={content.en.empty}
                    de={content.de.empty}
                    subFa={t.emptySub}
                    subEn={content.en.emptySub}
                    subDe={content.de.emptySub}
                />
            ) : (
                <Card>
                    <ul className="divide-y">
                        {initialHomework.map((hw) => (
                            <li
                                key={hw.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                            >
                                <div className="min-w-0 space-y-1">
                                    <p className="font-medium">{hw.lessonTitleFa}</p>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant="secondary">{hw.classSlug}</Badge>
                                        <span>{new Date(hw.dueAt).toLocaleDateString(locale)}</span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <Badge
                                        variant="outline"
                                        className={
                                            hw.assignedCount > 0 && hw.doneCount >= hw.assignedCount
                                                ? 'border-emerald-500/60 text-emerald-700 dark:text-emerald-400'
                                                : 'border-amber-500/60 text-amber-700 dark:text-amber-400'
                                        }
                                    >
                                        {t.progress(hw.doneCount, hw.assignedCount)}
                                    </Badge>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        disabled={isPending}
                                        onClick={() => {
                                            if (!window.confirm(t.deleteConfirm)) return;
                                            startTransition(async () => {
                                                const fd = new FormData();
                                                fd.set('id', hw.id);
                                                const result = await deleteHomeworkAssignment(fd);
                                                if (result.success) {
                                                    toast({ description: t.deleted });
                                                    router.refresh();
                                                }
                                            });
                                        }}
                                    >
                                        🗑
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
        </div>
    );
}
