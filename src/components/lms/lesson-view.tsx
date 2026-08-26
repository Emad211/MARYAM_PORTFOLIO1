'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    Clock,
    Loader2,
    Lock,
} from 'lucide-react';
import { ExercisePlayer } from '@/components/lms/exercise-player';
import { OpenTasksSection } from '@/components/lms/open-tasks-section';
import { toggleLessonComplete } from '@/app/actions/lms-actions';
import { SKILL_LABELS, formatLocalizedNumber } from '@/lib/label-utils';
import type { LmsLesson, LmsQuestion, LocalizedString, OpenTask } from '@/lib/types';

const content = {
    en: {
        backToCurriculum: 'Back to curriculum',
        minutes: 'min',
        freePreview: 'Free preview',
        markComplete: 'Mark as complete',
        completed: 'Completed',
        saving: 'Saving...',
        saveSuccess: 'Your progress was saved.',
        saveError: 'Could not save your progress. Please try again.',
        teaserTitle: 'Enroll to unlock this lesson',
        teaserBody:
            'This lesson is part of the full course. Create an account or sign in and request enrollment to follow the complete curriculum.',
        teaserCta: 'Sign in to enroll',
    },
    de: {
        backToCurriculum: 'Zurück zum Lehrplan',
        minutes: 'Min.',
        freePreview: 'Kostenlose Vorschau',
        markComplete: 'Als erledigt markieren',
        completed: 'Abgeschlossen',
        saving: 'Wird gespeichert...',
        saveSuccess: 'Ihr Fortschritt wurde gespeichert.',
        saveError: 'Ihr Fortschritt konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.',
        teaserTitle: 'Melden Sie sich an, um diese Lektion freizuschalten',
        teaserBody:
            'Diese Lektion ist Teil des vollständigen Kurses. Erstellen Sie ein Konto oder melden Sie sich an und fordern Sie eine Anmeldung an, um den kompletten Lehrplan zu nutzen.',
        teaserCta: 'Zum Anmelden',
    },
    fa: {
        backToCurriculum: 'بازگشت به سرفصل‌ها',
        minutes: 'دقیقه',
        freePreview: 'پیش‌نمایش رایگان',
        markComplete: 'علامت‌گذاری به‌عنوان تکمیل‌شده',
        completed: 'تکمیل شد',
        saving: 'در حال ذخیره...',
        saveSuccess: 'وضعیت پیشرفت شما ذخیره شد.',
        saveError: 'ذخیره وضعیت پیشرفت ممکن نشد. لطفاً دوباره تلاش کنید.',
        teaserTitle: 'برای دسترسی به این درس ثبت‌نام کنید',
        teaserBody:
            'این درس بخشی از دوره کامل است. برای دنبال کردن کل سرفصل‌ها، حساب کاربری بسازید یا وارد شوید و درخواست ثبت‌نام بدهید.',
        teaserCta: 'ورود و ثبت‌نام',
    },
} as const;

type LangContent = (typeof content)[keyof typeof content];

/** Maps a YouTube watch/short/embed URL onto youtube-nocookie; other hosts
 *  pass through untouched so admins can embed any oEmbed-friendly player. */
function toEmbedUrl(url: string): string {
    const patterns = [
        /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
        /youtu\.be\/([\w-]{11})/,
        /youtube\.com\/embed\/([\w-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match?.[1]) {
            return `https://www.youtube-nocookie.com/embed/${match[1]}`;
        }
    }
    return url;
}

function isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

/** Client-side gate: locked lessons stay hidden from anonymous visitors.
 *  Signed-in users (students AND admins) see the full content — access
 *  enforcement for real per-user data happens server-side in the actions. */
function LessonGate({
    isFreePreview,
    children,
}: {
    isFreePreview: boolean;
    children: React.ReactNode;
}) {
    const { language } = useLanguage();
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const t = content[language];

    if (!isFreePreview && loading) {
        return <Skeleton className="h-64 w-full" />;
    }

    if (!isFreePreview && !user) {
        return (
            <Card className="mt-8">
                <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                    <h2 className="font-headline text-2xl font-bold">{t.teaserTitle}</h2>
                    <p className="max-w-md text-sm text-muted-foreground">{t.teaserBody}</p>
                    <Button asChild>
                        <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
                            {t.teaserCta}
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return <>{children}</>;
}

function MarkCompleteToggle({
    lessonId,
    initialDone,
    t,
}: {
    lessonId: string;
    initialDone: boolean;
    t: LangContent;
}) {
    const [done, setDone] = useState(initialDone);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleLessonComplete(lessonId, !done);
            if (result.success) {
                setDone(!done);
                toast({ description: t.saveSuccess });
            } else {
                toast({ variant: 'destructive', description: t.saveError });
            }
        });
    };

    return (
        <Button onClick={handleToggle} disabled={isPending} variant={done ? 'outline' : 'default'}>
            {isPending ? (
                <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t.saving}
                </>
            ) : done ? (
                <>
                    <CheckCircle2 className="me-2 h-4 w-4 text-green-600" />
                    {t.completed}
                </>
            ) : (
                <>
                    <Circle className="me-2 h-4 w-4" />
                    {t.markComplete}
                </>
            )}
        </Button>
    );
}

export function LessonView({
    lesson,
    moduleTitle,
    classSlug,
    exercises,
    tasks,
    initialDone,
}: {
    lesson: LmsLesson;
    moduleTitle: LocalizedString;
    classSlug: string;
    exercises: LmsQuestion[];
    tasks?: OpenTask[];
    initialDone: boolean;
}) {
    const { language } = useLanguage();
    const t = content[language];

    const paragraphs = lesson.body[language]
        .split('\n\n')
        .filter((paragraph) => paragraph.trim().length > 0);

    return (
        <article className="py-16 md:py-24">
            <div className="container mx-auto max-w-3xl px-6">
                <Link
                    href={`/classes/${classSlug}/curriculum`}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                    {t.backToCurriculum}
                </Link>

                <header className="mt-6 space-y-3">
                    <p className="text-sm text-muted-foreground">{moduleTitle[language]}</p>
                    <h1 className="font-headline text-3xl font-bold md:text-4xl">
                        {lesson.title[language]}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{SKILL_LABELS[lesson.skill][language]}</Badge>
                        {typeof lesson.durationMin === 'number' && (
                            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {formatLocalizedNumber(lesson.durationMin, language)} {t.minutes}
                            </span>
                        )}
                        {lesson.isFreePreview && (
                            <Badge variant="outline">{t.freePreview}</Badge>
                        )}
                    </div>
                </header>

                <LessonGate isFreePreview={lesson.isFreePreview}>
                    <div className="mt-8 space-y-8">
                        {lesson.videoUrl && (
                            <div className="aspect-video overflow-hidden rounded-lg border">
                                <iframe
                                    src={
                                        isYouTubeUrl(lesson.videoUrl)
                                            ? toEmbedUrl(lesson.videoUrl)
                                            : lesson.videoUrl
                                    }
                                    title={lesson.title[language]}
                                    className="h-full w-full"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                            </div>
                        )}

                        <div className="space-y-4">
                            {paragraphs.map((paragraph, index) => (
                                <p
                                    key={index}
                                    className="whitespace-pre-line text-base leading-relaxed"
                                >
                                    {paragraph}
                                </p>
                            ))}
                        </div>

                        <ExercisePlayer questions={exercises} />

                        {tasks && tasks.length > 0 ? (
                            <OpenTasksSection tasks={tasks} />
                        ) : null}

                        <div className="flex justify-center border-t pt-8">
                            <MarkCompleteToggle
                                lessonId={lesson.id}
                                initialDone={initialDone}
                                t={t}
                            />
                        </div>
                    </div>
                </LessonGate>
            </div>
        </article>
    );
}
