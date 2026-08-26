'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, Clock, Loader2, LogOut, Pause, Play, XCircle } from 'lucide-react';
import { SKILL_LABELS } from '@/lib/label-utils';
import {
    abandonMockSession,
    completeMockSession,
    submitSection,
} from '@/app/actions/exam-actions';
import type {
    JnlAnswer,
    Language,
    LmsQuestion,
    MatchAnswer,
    McAnswer,
    MockSectionRunner,
    MockSessionInfo,
} from '@/lib/types';

const content = {
    en: {
        exit: 'Exit exam',
        exitConfirmTitle: 'Leave the exam?',
        exitConfirmBody:
            'If you leave now, this attempt will be marked as abandoned and cannot be resumed.',
        exitConfirmAction: 'Yes, leave',
        exitDismiss: 'Stay',
        timeRemaining: 'Time remaining',
        sectionProgress: 'Section {i} of {n}',
        minutes: 'min',
        submitSection: 'Submit section',
        submitting: 'Submitting...',
        answeredCount: '{done}/{total} answered',
        sectionSubmitted: 'Section submitted.',
        play: 'Play audio',
        pause: 'Pause audio',
        playsLeft: '{n} of {m} plays left',
        capNote: 'This audio can only be played {n} time(s).',
        noPlaysNote: 'This audio cannot be played in this simulation.',
        jnlOptions: {
            ja: 'Yes',
            nein: 'No',
            nichts: "Doesn't say",
        },
        matchPlaceholder: 'Choose...',
        failures: {
            unauthorized: 'Please sign in to continue.',
            not_found: 'This exam section could not be found.',
            closed: 'This session is already finished.',
            expired: 'The time for this session has run out.',
            invalid_input: 'Please answer every question first.',
            submit_failed: 'Your answers could not be submitted. Please try again.',
            finalize_failed: 'The exam could not be finalized. Please try again.',
        } as Record<string, string>,
        genericFailure: 'Something went wrong. Please try again.',
    },
    de: {
        exit: 'Prüfung verlassen',
        exitConfirmTitle: 'Die Prüfung verlassen?',
        exitConfirmBody:
            'Wenn Sie jetzt gehen, wird dieser Versuch als abgebrochen gewertet und kann nicht fortgesetzt werden.',
        exitConfirmAction: 'Ja, verlassen',
        exitDismiss: 'Bleiben',
        timeRemaining: 'Verbleibende Zeit',
        sectionProgress: 'Abschnitt {i} von {n}',
        minutes: 'Min.',
        submitSection: 'Abschnitt abgeben',
        submitting: 'Wird abgegeben...',
        answeredCount: '{done}/{total} beantwortet',
        sectionSubmitted: 'Abschnitt abgegeben.',
        play: 'Audio abspielen',
        pause: 'Audio pausieren',
        playsLeft: 'Noch {n} von {m} Wiedergaben',
        capNote: 'Dieses Audio kann nur {n}-mal abgespielt werden.',
        noPlaysNote: 'Dieses Audio kann in dieser Simulation nicht abgespielt werden.',
        jnlOptions: {
            ja: 'Ja',
            nein: 'Nein',
            nichts: 'Steht nicht im Text',
        },
        matchPlaceholder: 'Auswählen...',
        failures: {
            unauthorized: 'Bitte melden Sie sich an, um fortzufahren.',
            not_found: 'Dieser Prüfungsteil konnte nicht gefunden werden.',
            closed: 'Diese Sitzung ist bereits abgeschlossen.',
            expired: 'Die Zeit für diese Sitzung ist abgelaufen.',
            invalid_input: 'Bitte beantworten Sie zuerst alle Fragen.',
            submit_failed:
                'Ihre Antworten konnten nicht abgegeben werden. Bitte versuchen Sie es erneut.',
            finalize_failed:
                'Die Prüfung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.',
        } as Record<string, string>,
        genericFailure: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
    },
    fa: {
        exit: 'خروج از آزمون',
        exitConfirmTitle: 'آزمون را ترک می‌کنید؟',
        exitConfirmBody:
            'اگر الان خارج شوید، این تلاش رهاشده ثبت می‌شود و قابل ادامه نیست.',
        exitConfirmAction: 'بله، خارج شو',
        exitDismiss: 'می‌مانم',
        timeRemaining: 'زمان باقی‌مانده',
        sectionProgress: 'بخش {i} از {n}',
        minutes: 'دقیقه',
        submitSection: 'ارسال بخش',
        submitting: 'در حال ارسال...',
        answeredCount: '{done} از {total} پاسخ داده شد',
        sectionSubmitted: 'بخش ارسال شد.',
        play: 'پخش صدا',
        pause: 'توقف پخش',
        playsLeft: '{n} از {m} بار پخش باقی مانده',
        capNote: 'این صدا فقط {n} بار قابل پخش است.',
        noPlaysNote: 'این صدا در این شبیه‌سازی قابل پخش نیست.',
        jnlOptions: {
            ja: 'بله',
            nein: 'خیر',
            nichts: 'در متن نیامده',
        },
        matchPlaceholder: 'انتخاب کنید...',
        failures: {
            unauthorized: 'برای ادامه لطفاً وارد شوید.',
            not_found: 'این بخش آزمون پیدا نشد.',
            closed: 'این جلسه قبلاً پایان یافته است.',
            expired: 'زمان این جلسه تمام شده است.',
            invalid_input: 'لطفاً ابتدا به همه پرسش‌ها پاسخ دهید.',
            submit_failed: 'ارسال پاسخ‌های شما ممکن نشد. لطفاً دوباره تلاش کنید.',
            finalize_failed: 'پایان آزمون ممکن نشد. لطفاً دوباره تلاش کنید.',
        } as Record<string, string>,
        genericFailure: 'مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
    },
} as const;

type PlayerAnswer = McAnswer | JnlAnswer | MatchAnswer;

function fillTemplate(template: string, values: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

function buildListeningUrl(path: string): string {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listening/${path}`;
}

function remainingSeconds(expiresAt: string): number {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatCountdown(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, '0'))
        .join(':');
}

function isAnswered(
    question: LmsQuestion,
    answer: PlayerAnswer | null | undefined
): boolean {
    if (!answer) return false;
    if (question.type === 'match') {
        if (!('mapping' in answer)) return false;
        const payload =
            question.payload && 'left' in question.payload ? question.payload : null;
        if (!payload) return false;
        return payload.left.every((item) => Boolean(answer.mapping[item.id]));
    }
    return 'correct' in answer && Boolean(answer.correct);
}

/** Simulation player with a hard replay cap and no seek bar — mirrors the
 *  real exam rule that listening tracks may only be played a fixed number
 *  of times. */
function ListeningCappedPlayer({
    audioPath,
    playsAllowed,
    language,
    frozen,
}: {
    audioPath: string;
    playsAllowed?: number | undefined;
    language: Language;
    frozen: boolean;
}) {
    const t = content[language];
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [playedCount, setPlayedCount] = useState(0);

    const maxPlays = typeof playsAllowed === 'number' ? playsAllowed : 2;
    const exhausted = playedCount >= maxPlays;
    const blocked = frozen || maxPlays <= 0 || exhausted;

    useEffect(() => {
        const el = audioRef.current;
        return () => {
            el?.pause();
        };
    }, []);

    const toggle = () => {
        const el = audioRef.current;
        if (!el || blocked) return;
        if (el.paused) {
            void el.play().catch(() => undefined);
        } else {
            el.pause();
        }
    };

    return (
        <div className="space-y-2 rounded-md border bg-muted/40 p-3">
            <audio
                ref={audioRef}
                src={buildListeningUrl(audioPath)}
                preload="none"
                className="hidden"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                    setPlaying(false);
                    setPlayedCount((count) => count + 1);
                }}
            />
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    size="icon"
                    variant={playing ? 'default' : 'outline'}
                    onClick={toggle}
                    disabled={blocked}
                    aria-label={playing ? t.pause : t.play}
                >
                    {playing ? (
                        <Pause className="h-4 w-4" />
                    ) : (
                        <Play className="h-4 w-4" />
                    )}
                </Button>
                <div className="flex items-center gap-1.5" aria-hidden="true">
                    {Array.from({ length: Math.max(maxPlays, 0) }, (_, i) => (
                        <span
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                                i < maxPlays - playedCount
                                    ? 'bg-primary'
                                    : 'bg-muted-foreground/30'
                            }`}
                        />
                    ))}
                </div>
                {!blocked && maxPlays > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {fillTemplate(t.playsLeft, {
                            n: String(Math.max(maxPlays - playedCount, 0)),
                            m: String(maxPlays),
                        })}
                    </span>
                )}
            </div>
            {(maxPlays <= 0 || exhausted) && (
                <p className="text-xs text-muted-foreground">
                    {maxPlays <= 0
                        ? t.noPlaysNote
                        : fillTemplate(t.capNote, { n: String(maxPlays) })}
                </p>
            )}
        </div>
    );
}

export function ExamRunner({
    session,
    sections,
}: {
    session: MockSessionInfo;
    sections: MockSectionRunner[];
}) {
    const { language } = useLanguage();
    const t = content[language];
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const ordered = useMemo(
        () => [...sections].sort((a, b) => a.sortOrder - b.sortOrder),
        [sections]
    );

    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Map<string, PlayerAnswer>>(
        () => new Map()
    );
    const [submittedIds, setSubmittedIds] = useState<Set<string>>(
        () => new Set()
    );
    // Per-section flash map: questionId -> correct? (shown until navigation).
    const [flash, setFlash] = useState<Map<string, Map<string, boolean>>>(
        () => new Map()
    );

    const finishedRef = useRef(false);
    const advanceTimerRef = useRef<number | null>(null);

    const [secondsLeft, setSecondsLeft] = useState(() =>
        remainingSeconds(session.expiresAt)
    );

    useEffect(() => {
        const id = window.setInterval(
            () => setSecondsLeft(remainingSeconds(session.expiresAt)),
            1000
        );
        return () => window.clearInterval(id);
    }, [session.expiresAt]);

    useEffect(() => {
        return () => {
            if (advanceTimerRef.current !== null) {
                window.clearTimeout(advanceTimerRef.current);
            }
        };
    }, []);

    const finishFlow = useCallback(() => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        startTransition(async () => {
            const result = await completeMockSession(session.id);
            if (!result.success) {
                toast({
                    variant: 'destructive',
                    description: t.failures.finalize_failed ?? t.genericFailure,
                });
            }
            router.push(`/dashboard/exams/results/${session.id}`);
        });
    }, [session.id, router, t, toast]);

    // Server deadline reached (or already past on mount) → finalize once.
    useEffect(() => {
        if (secondsLeft === 0) finishFlow();
    }, [secondsLeft, finishFlow]);

    const section = ordered[currentIdx];
    if (!section) return null;

    const frozen = submittedIds.has(section.id);
    const sectionFlash = flash.get(section.id);

    const setAnswer = (questionId: string, next: PlayerAnswer) => {
        setAnswers((prev) => new Map(prev).set(questionId, next));
    };

    const setMatchPart = (questionId: string, leftId: string, rightId: string) => {
        setAnswers((prev) => {
            const existing = prev.get(questionId);
            const mapping =
                existing && 'mapping' in existing ? existing.mapping : {};
            return new Map(prev).set(questionId, {
                mapping: { ...mapping, [leftId]: rightId },
            });
        });
    };

    const answeredCount = section.questions.filter((q) =>
        isAnswered(q, answers.get(q.id))
    ).length;
    const allAnswered = answeredCount === section.questions.length;

    const handleSubmitSection = () => {
        if (frozen || !allAnswered) return;
        startTransition(async () => {
            const payload = section.questions.flatMap((q) => {
                const answer = answers.get(q.id);
                return answer ? [{ questionId: q.id, answer }] : [];
            });
            const result = await submitSection(session.id, section.id, payload);
            if (!result.success) {
                toast({
                    variant: 'destructive',
                    description: t.failures[result.message] ?? t.genericFailure,
                });
                return;
            }
            const questionFlash = new Map<string, boolean>();
            for (const item of result.results ?? []) {
                questionFlash.set(item.questionId, item.isCorrect);
            }
            setFlash((prev) => new Map(prev).set(section.id, questionFlash));
            setSubmittedIds((prev) => new Set(prev).add(section.id));

            if (currentIdx >= ordered.length - 1) {
                finishFlow();
            } else {
                advanceTimerRef.current = window.setTimeout(
                    () => setCurrentIdx((idx) => idx + 1),
                    800
                );
            }
        });
    };

    const handleAbandon = () => {
        startTransition(async () => {
            const result = await abandonMockSession(session.id);
            if (!result.success) {
                toast({
                    variant: 'destructive',
                    description: t.failures.finalize_failed ?? t.genericFailure,
                });
                return;
            }
            router.push('/dashboard/exams');
        });
    };

    return (
        <div className="space-y-6">
            {/* Sticky status bar: server deadline countdown + section progress.
                Stretches across the dashboard main padding via negative margins. */}
            <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                            {t.timeRemaining}
                        </span>
                        <span
                            aria-label={t.timeRemaining}
                            className={`font-mono text-lg font-bold tabular-nums ${
                                secondsLeft <= 60
                                    ? 'animate-pulse text-red-600 dark:text-red-400'
                                    : ''
                            }`}
                        >
                            {formatCountdown(secondsLeft)}
                        </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {fillTemplate(t.sectionProgress, {
                            i: String(currentIdx + 1),
                            n: String(ordered.length),
                        })}
                    </span>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <LogOut className="me-2 h-4 w-4" />
                                {t.exit}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t.exitConfirmTitle}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t.exitConfirmBody}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t.exitDismiss}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleAbandon}>
                                    {t.exitConfirmAction}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Section stepper: done = check, current = primary, future locked. */}
            <div role="tablist" className="flex flex-wrap gap-2">
                {ordered.map((s, i) => {
                    const done = submittedIds.has(s.id);
                    const isCurrent = i === currentIdx;
                    const locked = !done && i > currentIdx;
                    return (
                        <button
                            key={s.id}
                            type="button"
                            role="tab"
                            aria-selected={isCurrent}
                            disabled={locked}
                            onClick={() => setCurrentIdx(i)}
                            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                                isCurrent
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : done
                                      ? 'border-green-600/40 bg-green-600/10 hover:bg-green-600/20'
                                      : 'hover:bg-muted'
                            } ${locked ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            {done ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                                <span className="font-mono">{i + 1}</span>
                            )}
                            {SKILL_LABELS[s.section][language]}
                        </button>
                    );
                })}
            </div>

            <Card>
                <CardContent className="space-y-5 pt-6">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="font-headline text-xl font-bold">
                            {SKILL_LABELS[section.section][language]}
                        </h2>
                        <Badge variant="outline">
                            <Clock className="me-1 h-3.5 w-3.5" />
                            {section.durationMin} {t.minutes}
                        </Badge>
                    </div>

                    {section.questions.map((question, qIdx) => {
                        const answer = answers.get(question.id);
                        const outcome = sectionFlash?.get(question.id);
                        return (
                            <div
                                key={question.id}
                                className="relative space-y-3 rounded-md border p-4"
                            >
                                {question.audioPath && (
                                    <ListeningCappedPlayer
                                        audioPath={question.audioPath}
                                        playsAllowed={question.playsAllowed}
                                        language={language}
                                        frozen={frozen}
                                    />
                                )}

                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-base font-medium leading-relaxed">
                                        <span className="me-2 text-muted-foreground">
                                            {qIdx + 1}.
                                        </span>
                                        {question.prompt[language]}
                                    </p>
                                    {outcome !== undefined &&
                                        (outcome ? (
                                            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                                        ) : (
                                            <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                                        ))}
                                </div>

                                {question.type === 'mc' && (
                                    <RadioGroup
                                        value={
                                            answer && 'correct' in answer
                                                ? answer.correct
                                                : ''
                                        }
                                        onValueChange={(value) =>
                                            setAnswer(question.id, { correct: value })
                                        }
                                        disabled={frozen}
                                        className="gap-3"
                                    >
                                        {(question.payload && 'options' in question.payload
                                            ? question.payload.options
                                            : []
                                        ).map((option) => (
                                            <div
                                                key={option.id}
                                                className="flex items-center gap-3"
                                            >
                                                <RadioGroupItem
                                                    value={option.id}
                                                    id={`mc-${question.id}-${option.id}`}
                                                    disabled={frozen}
                                                />
                                                <Label
                                                    htmlFor={`mc-${question.id}-${option.id}`}
                                                    className="cursor-pointer font-normal"
                                                >
                                                    {option.text[language]}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}

                                {question.type === 'jnl' && (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        {(['ja', 'nein', 'nichts'] as const).map((value) => {
                                            const selected =
                                                answer && 'correct' in answer
                                                    ? answer.correct === value
                                                    : false;
                                            return (
                                                <Button
                                                    key={value}
                                                    type="button"
                                                    variant={
                                                        selected ? 'default' : 'outline'
                                                    }
                                                    onClick={() =>
                                                        setAnswer(question.id, {
                                                            correct: value,
                                                        })
                                                    }
                                                    disabled={frozen}
                                                    className="h-12"
                                                >
                                                    {t.jnlOptions[value]}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                )}

                                {question.type === 'match' &&
                                    (() => {
                                        const payload =
                                            question.payload && 'left' in question.payload
                                                ? question.payload
                                                : null;
                                        if (!payload) return null;
                                        const mapping =
                                            answer && 'mapping' in answer
                                                ? answer.mapping
                                                : {};
                                        return (
                                            <div className="space-y-3">
                                                {payload.left.map((leftItem) => (
                                                    <div
                                                        key={leftItem.id}
                                                        className="space-y-1"
                                                    >
                                                        <Label
                                                            htmlFor={`match-${question.id}-${leftItem.id}`}
                                                        >
                                                            {leftItem.text[language]}
                                                        </Label>
                                                        <select
                                                            id={`match-${question.id}-${leftItem.id}`}
                                                            value={mapping[leftItem.id] ?? ''}
                                                            onChange={(e) =>
                                                                setMatchPart(
                                                                    question.id,
                                                                    leftItem.id,
                                                                    e.target.value
                                                                )
                                                            }
                                                            disabled={frozen}
                                                            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <option value="" disabled>
                                                                {t.matchPlaceholder}
                                                            </option>
                                                            {payload.right.map((rightItem) => (
                                                                <option
                                                                    key={rightItem.id}
                                                                    value={rightItem.id}
                                                                >
                                                                    {rightItem.text[language]}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}

                                {frozen && (
                                    <div
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 rounded-md bg-background/40"
                                    />
                                )}
                            </div>
                        );
                    })}

                    {frozen ? (
                        <div className="rounded-md border border-green-600/30 bg-green-600/10 p-3 text-center text-sm font-medium text-green-700 dark:text-green-400">
                            {t.sectionSubmitted}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-muted-foreground">
                                {fillTemplate(t.answeredCount, {
                                    done: String(answeredCount),
                                    total: String(section.questions.length),
                                })}
                            </span>
                            <Button
                                type="button"
                                onClick={handleSubmitSection}
                                disabled={!allAnswered || isPending}
                            >
                                {isPending && (
                                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                )}
                                {isPending ? t.submitting : t.submitSection}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
