'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PartyPopper, Trophy } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { gradeCard } from '@/app/actions/vocab-actions';
import { formatLocalizedNumber } from '@/lib/label-utils';
import { cn } from '@/lib/utils';
import type { DueCard, ReviewGrade } from '@/lib/types';

const content = {
    en: {
        emptyTitle: 'All reviews done for today!',
        emptyBody: 'Come back tomorrow to keep your streak going.',
        backToDashboard: 'Back to dashboard',
        progressOf: '{i} of {n}',
        showAnswer: 'Show answer',
        completeTitle: 'Session complete — {n} cards reviewed.',
        praise: 'Nice work. Consistency beats cramming — see you tomorrow!',
        moreReviews: 'More reviews',
        grades: {
            again: 'Again',
            hard: 'Hard',
            good: 'Good',
            easy: 'Easy',
        },
        againHint: '~10 min',
        errors: {
            unauthorized: 'You need to sign in to review cards.',
            not_found: 'That card no longer exists.',
            invalid_input: 'Invalid review data.',
            grade_failed: 'Could not save the review. Please try again.',
        },
    },
    de: {
        emptyTitle: 'Für heute ist alles geschafft!',
        emptyBody: 'Kommen Sie morgen wieder, um Ihre Serie fortzusetzen.',
        backToDashboard: 'Zurück zum Dashboard',
        progressOf: '{i} von {n}',
        showAnswer: 'Antwort zeigen',
        completeTitle: 'Session abgeschlossen — {n} Karten gelernt.',
        praise: 'Gut gemacht. Regelmäßigkeit schlägt Büffeln — bis morgen!',
        moreReviews: 'Mehr üben',
        grades: {
            again: 'Wiederholen',
            hard: 'Schwer',
            good: 'Gut',
            easy: 'Leicht',
        },
        againHint: '~10 Min.',
        errors: {
            unauthorized: 'Zum Wiederholen müssen Sie angemeldet sein.',
            not_found: 'Diese Karte existiert nicht mehr.',
            invalid_input: 'Ungültige Wiederholungsdaten.',
            grade_failed: 'Die Wiederholung konnte nicht gespeichert werden. Bitte erneut versuchen.',
        },
    },
    fa: {
        emptyTitle: 'برای امروز همه مرور انجام شد!',
        emptyBody: 'فردا دوباره بیایید تا زنجیرهتان ادامه پیدا کند.',
        backToDashboard: 'بازگشت به داشبورد',
        progressOf: '{i} از {n}',
        showAnswer: 'نمایش پاسخ',
        completeTitle: 'جلسه تمام شد — {n} کارت مرور شد.',
        praise: 'آفرین. تداوم بهتر از حفظ کردن یکجا است — فردا میبینیمتان!',
        moreReviews: 'مرور بیشتر',
        grades: {
            again: 'دوباره',
            hard: 'سخت',
            good: 'خوب',
            easy: 'آسان',
        },
        againHint: '~۱۰ دقیقه',
        errors: {
            unauthorized: 'برای مرور باید وارد شوید.',
            not_found: 'این کارت دیگر وجود ندارد.',
            invalid_input: 'دادههای مرور نامعتبر است.',
            grade_failed: 'ذخیره مرور ممکن نشد. لطفاً دوباره تلاش کنید.',
        },
    },
} as const;

type GradeKey = keyof typeof content.en.grades;

const KEY_TO_GRADE: Record<string, ReviewGrade> = {
    '1': 'again',
    '2': 'hard',
    '3': 'good',
    '4': 'easy',
};

const GRADE_BUTTON_STYLES: Record<GradeKey, string> = {
    again: '',
    hard: 'border-amber-500 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400',
    good: '',
    easy: 'border-emerald-600 text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-400',
};

function isTypingTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return (
        el !== null &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
    );
}

export function FlashcardSession({ initialCards }: { initialCards: DueCard[] }) {
    const { language } = useLanguage();
    const t = content[language];
    const router = useRouter();
    const { toast } = useToast();

    const [index, setIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [reviewedCount, setReviewedCount] = useState(0);
    const [isPending, startTransition] = useTransition();

    const total = initialCards.length;
    const done = index >= total;
    const card = done ? undefined : initialCards[index];

    // `More reviews` triggers router.refresh(): the server re-runs
    // startReviewSession and hands us a fresh queue, so restart the session
    // whenever a new queue arrives.
    useEffect(() => {
        setIndex(0);
        setRevealed(false);
        setReviewedCount(0);
    }, [initialCards]);

    const handleGrade = useCallback(
        (grade: ReviewGrade) => {
            if (!card || isPending) return;
            startTransition(async () => {
                const result = await gradeCard(card.id, grade);
                if (result.success) {
                    setReviewedCount((c) => c + 1);
                    setIndex((i) => i + 1);
                    setRevealed(false);
                    return;
                }
                const description =
                    result.message === 'unauthorized' ||
                    result.message === 'not_found' ||
                    result.message === 'invalid_input'
                        ? t.errors[result.message]
                        : t.errors.grade_failed;
                toast({ variant: 'destructive', description });
            });
        },
        [card, isPending, t, toast]
    );

    // Keyboard: Enter/Space reveals the answer on the front face; 1–4 grade
    // the card on the back face. Listener is removed on cleanup.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (isTypingTarget(event.target)) return;
            if (done || isPending) return;

            if (!revealed) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setRevealed(true);
                }
                return;
            }

            const grade = KEY_TO_GRADE[event.key];
            if (grade) {
                event.preventDefault();
                handleGrade(grade);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [revealed, done, isPending, handleGrade]);

    if (total === 0) {
        return (
            <div className="mx-auto w-full max-w-xl">
                <Card>
                    <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                        <PartyPopper aria-hidden="true" className="h-12 w-12 text-primary" />
                        <h1 className="font-headline text-2xl font-semibold">{t.emptyTitle}</h1>
                        <p className="text-muted-foreground">{t.emptyBody}</p>
                        <Button asChild variant="outline">
                            <Link href="/dashboard">{t.backToDashboard}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (done) {
        return (
            <div className="mx-auto w-full max-w-xl">
                <Card>
                    <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                        <Trophy aria-hidden="true" className="h-12 w-12 text-amber-500" />
                        <h1 className="font-headline text-2xl font-semibold">
                            {t.completeTitle.replace(
                                '{n}',
                                formatLocalizedNumber(reviewedCount, language)
                            )}
                        </h1>
                        <p className="text-muted-foreground">{t.praise}</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Button asChild variant="outline">
                                <Link href="/dashboard">{t.backToDashboard}</Link>
                            </Button>
                            <Button onClick={() => router.refresh()}>{t.moreReviews}</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const progressLabel = t.progressOf
        .replace('{i}', formatLocalizedNumber(index + 1, language))
        .replace('{n}', formatLocalizedNumber(total, language));

    return (
        <div className="mx-auto w-full max-w-2xl space-y-6">
            <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{progressLabel}</p>
                <Progress
                    value={Math.round((reviewedCount / total) * 100)}
                    aria-label={progressLabel}
                />
            </div>

            <Card>
                <CardContent className="flex min-h-72 flex-col items-center justify-center gap-6 py-10 text-center">
                    {!revealed ? (
                        <>
                            <Badge variant="outline" className="text-xs">
                                {card?.wordType}
                            </Badge>
                            <p className="break-words px-4 font-headline text-5xl font-semibold sm:text-6xl">
                                {card?.frontDe}
                            </p>
                            <Button size="lg" onClick={() => setRevealed(true)}>
                                {t.showAnswer}
                            </Button>
                        </>
                    ) : (
                        <>
                            {card?.hint && (
                                <p className="text-sm text-muted-foreground">
                                    {card.hint[language]}
                                </p>
                            )}
                            <div className="space-y-1">
                                {card?.exampleDe && (
                                    <p className="text-lg font-semibold">{card.exampleDe}</p>
                                )}
                                {card?.exampleEn && (
                                    <p className="text-sm text-muted-foreground">
                                        {card.exampleEn}
                                    </p>
                                )}
                                {card?.exampleFa && (
                                    <p className="text-sm text-muted-foreground">
                                        {card.exampleFa}
                                    </p>
                                )}
                            </div>

                            <hr className="w-full border-border" />

                            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                                {(Object.keys(t.grades) as GradeKey[]).map((key) => (
                                    <Button
                                        key={key}
                                        variant={
                                            key === 'again'
                                                ? 'destructive'
                                                : key === 'good'
                                                  ? 'default'
                                                  : 'outline'
                                        }
                                        className={cn(
                                            'h-auto flex-col gap-1 py-3',
                                            GRADE_BUTTON_STYLES[key]
                                        )}
                                        disabled={isPending}
                                        onClick={() => handleGrade(key)}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <kbd className="rounded border bg-muted px-1 font-mono text-[10px] leading-4">
                                                {key === 'again' ? '1' : key === 'hard' ? '2' : key === 'good' ? '3' : '4'}
                                            </kbd>
                                            {t.grades[key]}
                                        </span>
                                        {key === 'again' && (
                                            <span className="text-[11px] font-normal opacity-80">
                                                {t.againHint}
                                            </span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
