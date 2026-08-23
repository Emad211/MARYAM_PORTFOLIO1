'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { SKILL_LABELS, formatLocalizedNumber } from '@/lib/label-utils';
import type { Class, CurriculumModule } from '@/lib/types';

const content = {
    en: {
        title: 'Curriculum',
        backToClass: 'Back to class',
        progressTemplate: '{done} of {total} lessons completed',
        minutes: 'min',
        freePreview: 'Free preview',
        empty: 'No lessons have been published for this class yet.',
    },
    de: {
        title: 'Lehrplan',
        backToClass: 'Zurück zum Kurs',
        progressTemplate: '{done} von {total} Lektionen abgeschlossen',
        minutes: 'Min.',
        freePreview: 'Kostenlose Vorschau',
        empty: 'Für diesen Kurs wurden noch keine Lektionen veröffentlicht.',
    },
    fa: {
        title: 'سرفصل‌ها',
        backToClass: 'بازگشت به کلاس',
        progressTemplate: '{done} از {total} درس تکمیل شده است',
        minutes: 'دقیقه',
        freePreview: 'پیش‌نمایش رایگان',
        empty: 'هنوز هیچ درسی برای این کلاس منتشر نشده است.',
    },
} as const;

function progressLine(template: string, done: number, total: number): string {
    return template.replace('{done}', String(done)).replace('{total}', String(total));
}

export function CurriculumView({
    classInfo,
    modules,
    progress,
}: {
    classInfo: Class;
    modules: CurriculumModule[];
    progress: Record<string, boolean>;
}) {
    const { language } = useLanguage();
    const t = content[language];

    const allLessons = modules.flatMap((module) => module.lessons);
    const total = allLessons.length;
    const done = allLessons.filter((lesson) => progress[lesson.id]).length;

    return (
        <div className="py-16 md:py-24">
            <div className="container mx-auto max-w-4xl px-6">
                <Link
                    href={`/classes/${classInfo.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                    {t.backToClass}
                </Link>

                <header className="mt-6">
                    <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        {t.title}
                    </p>
                    <h1 className="mt-2 font-headline text-3xl font-bold md:text-4xl">
                        {classInfo.title[language]}
                    </h1>
                    <p className="mt-3 text-muted-foreground">
                        {progressLine(t.progressTemplate, done, total)}
                    </p>
                </header>

                {modules.length === 0 ? (
                    <Card className="mt-8">
                        <CardContent className="py-10 text-center text-muted-foreground">
                            {t.empty}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="mt-8 space-y-6">
                        {modules.map((module) => (
                            <Card key={module.id}>
                                <CardHeader>
                                    <CardTitle className="font-headline text-xl">
                                        {module.title[language]}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {module.lessons.map((lesson) => {
                                        const isDone = Boolean(progress[lesson.id]);
                                        return (
                                            <Link
                                                key={lesson.id}
                                                href={`/classes/${classInfo.slug}/lessons/${lesson.id}`}
                                                className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                                            >
                                                {isDone ? (
                                                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                                                ) : (
                                                    <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                                )}
                                                <span className="font-medium">
                                                    {lesson.title[language]}
                                                </span>
                                                <span className="ms-auto flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
                                                    <Badge variant="secondary">
                                                        {SKILL_LABELS[lesson.skill][language]}
                                                    </Badge>
                                                    {typeof lesson.durationMin === 'number' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatLocalizedNumber(lesson.durationMin, language)}{' '}
                                                            {t.minutes}
                                                        </span>
                                                    )}
                                                    {lesson.isFreePreview && (
                                                        <Badge variant="outline">{t.freePreview}</Badge>
                                                    )}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
