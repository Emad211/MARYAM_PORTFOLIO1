'use client';

import { useState, useTransition } from 'react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { submitAnswer } from '@/app/actions/lms-actions';
import type {
    JnlAnswer,
    LmsQuestion,
    MatchAnswer,
    McAnswer,
} from '@/lib/types';

const content = {
    en: {
        heading: 'Exercises',
        questionCounter: 'Question {index} of {total}',
        checkAnswers: 'Check answers',
        checking: 'Checking...',
        retry: 'Try again',
        allCorrect: 'Perfect! All answers are correct.',
        summaryTemplate: '{correct} of {total} correct',
        jnlOptions: {
            ja: 'Yes',
            nein: 'No',
            nichts: "Doesn't say",
        },
        matchPlaceholder: 'Choose...',
        audioLabel: 'Audio',
        failures: {
            invalid_input: 'Please answer every question first.',
            unauthorized: 'Please sign in to check your answers.',
            not_found: 'This exercise could not be found.',
            failed: 'Your answers could not be checked. Please try again.',
        } as Record<string, string>,
        genericFailure: 'Your answers could not be checked. Please try again.',
    },
    de: {
        heading: 'Übungen',
        questionCounter: 'Frage {index} von {total}',
        checkAnswers: 'Antworten prüfen',
        checking: 'Wird geprüft...',
        retry: 'Erneut versuchen',
        allCorrect: 'Perfekt! Alle Antworten sind richtig.',
        summaryTemplate: '{correct} von {total} richtig',
        jnlOptions: {
            ja: 'Ja',
            nein: 'Nein',
            nichts: 'Steht nicht im Text',
        },
        matchPlaceholder: 'Auswählen...',
        audioLabel: 'Hören',
        failures: {
            invalid_input: 'Bitte beantworten Sie zuerst alle Fragen.',
            unauthorized: 'Bitte melden Sie sich an, um Ihre Antworten zu prüfen.',
            not_found: 'Diese Übung konnte nicht gefunden werden.',
            failed: 'Ihre Antworten konnten nicht geprüft werden. Bitte versuchen Sie es erneut.',
        } as Record<string, string>,
        genericFailure: 'Ihre Antworten konnten nicht geprüft werden. Bitte versuchen Sie es erneut.',
    },
    fa: {
        heading: 'تمرین‌ها',
        questionCounter: 'پرسش {index} از {total}',
        checkAnswers: 'بررسی پاسخ‌ها',
        checking: 'در حال بررسی...',
        retry: 'تلاش دوباره',
        allCorrect: 'عالی! همه پاسخ‌ها درست است.',
        summaryTemplate: '{correct} از {total} پاسخ درست',
        jnlOptions: {
            ja: 'بله',
            nein: 'خیر',
            nichts: 'در متن نیامده',
        },
        matchPlaceholder: 'انتخاب کنید...',
        audioLabel: 'صوت',
        failures: {
            invalid_input: 'لطفاً ابتدا به همه پرسش‌ها پاسخ دهید.',
            unauthorized: 'برای بررسی پاسخ‌ها لطفاً وارد شوید.',
            not_found: 'این تمرین پیدا نشد.',
            failed: 'بررسی پاسخ‌های شما ممکن نشد. لطفاً دوباره تلاش کنید.',
        } as Record<string, string>,
        genericFailure: 'بررسی پاسخ‌های شما ممکن نشد. لطفاً دوباره تلاش کنید.',
    },
} as const;

type PlayerAnswer = McAnswer | JnlAnswer | MatchAnswer;

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

function fillTemplate(template: string, values: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** Public object URL inside the 'listening' storage bucket. */
function buildListeningUrl(path: string): string {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listening/${path}`;
}

export function ExercisePlayer({ questions }: { questions: LmsQuestion[] }) {
    const { language } = useLanguage();
    const t = content[language];
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<(PlayerAnswer | null)[]>(
        () => questions.map(() => null)
    );
    const [results, setResults] = useState<(boolean | null)[]>(
        () => questions.map(() => null)
    );
    const [checked, setChecked] = useState(false);

    if (questions.length === 0) return null;

    const question = questions[index];
    if (!question) return null;

    const answeredAll = questions.every((q, i) => isAnswered(q, answers[i]));
    const correctCount = results.filter((result) => result === true).length;
    const currentAnswer = answers[index];

    const setAnswer = (next: PlayerAnswer) => {
        setAnswers((prev) => prev.map((a, i) => (i === index ? next : a)));
    };

    const handleMatchChange = (leftId: string, rightId: string) => {
        setAnswers((prev) =>
            prev.map((a, i) => {
                if (i !== index) return a;
                const current = a && 'mapping' in a ? a.mapping : {};
                return { mapping: { ...current, [leftId]: rightId } };
            })
        );
    };

    const handleCheck = () => {
        startTransition(async () => {
            const collected: boolean[] = [];
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const a = answers[i];
                if (!q || !a || !isAnswered(q, a)) continue;
                const result = await submitAnswer(q.id, a);
                if (!result.success) {
                    // Map the stable failure key to a localized message.
                    const message = t.failures[result.message] ?? t.genericFailure;
                    toast({ variant: 'destructive', description: message });
                    return;
                }
                collected.push(Boolean(result.isCorrect));
            }
            setResults(collected);
            setChecked(true);
        });
    };

    const handleRetry = () => {
        setAnswers(questions.map(() => null));
        setResults(questions.map(() => null));
        setChecked(false);
        setIndex(0);
    };

    const resultForCurrent = results[index] ?? null;

    return (
        <Card>
            <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="font-headline text-xl font-bold">{t.heading}</h2>
                    <span className="text-sm text-muted-foreground">
                        {fillTemplate(t.questionCounter, {
                            index: String(index + 1),
                            total: String(questions.length),
                        })}
                    </span>
                </div>

                {/* Progress dots — clickable to move between questions; color
                    encodes per-question result once checked. */}
                <div className="flex items-center justify-center gap-2" role="tablist">
                    {questions.map((q, i) => {
                        const result = results[i] ?? null;
                        const dotClass =
                            checked && result !== null
                                ? result
                                    ? 'bg-green-600'
                                    : 'bg-red-500'
                                : i === index
                                  ? 'bg-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                                  : answers[i]
                                    ? 'bg-primary/40'
                                    : 'bg-muted-foreground/30';
                        return (
                            <button
                                key={q.id}
                                type="button"
                                aria-label={String(i + 1)}
                                onClick={() => setIndex(i)}
                                className={`h-3 w-3 rounded-full transition-colors ${dotClass}`}
                            />
                        );
                    })}
                </div>

                <div className="space-y-4">
                    {question.audioPath && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium">{t.audioLabel}</p>
                            {/* Practice mode: unlimited replays — the play-capped
                                player lives only in the mock-exam runner. */}
                            <audio
                                controls
                                preload="none"
                                src={buildListeningUrl(question.audioPath)}
                                className="w-full"
                            />
                        </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-base font-medium leading-relaxed">
                            {question.prompt[language]}
                        </p>
                        {checked && resultForCurrent !== null && (
                            resultForCurrent ? (
                                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                            ) : (
                                <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                            )
                        )}
                    </div>

                    {question.type === 'mc' && (
                        <RadioGroup
                            value={
                                currentAnswer && 'correct' in currentAnswer
                                    ? currentAnswer.correct
                                    : ''
                            }
                            onValueChange={(value) => setAnswer({ correct: value })}
                            className="gap-3"
                        >
                            {(question.payload && 'options' in question.payload
                                ? question.payload.options
                                : []
                            ).map((option) => (
                                <div key={option.id} className="flex items-center gap-3">
                                    <RadioGroupItem
                                        value={option.id}
                                        id={`mc-${question.id}-${option.id}`}
                                        disabled={checked}
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
                                    currentAnswer && 'correct' in currentAnswer
                                        ? currentAnswer.correct === value
                                        : false;
                                return (
                                    <Button
                                        key={value}
                                        type="button"
                                        variant={selected ? 'default' : 'outline'}
                                        onClick={() => setAnswer({ correct: value })}
                                        disabled={checked}
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
                                currentAnswer && 'mapping' in currentAnswer
                                    ? currentAnswer.mapping
                                    : {};
                            return (
                                <div className="space-y-3">
                                    {payload.left.map((leftItem) => (
                                        <div key={leftItem.id} className="space-y-1">
                                            <Label htmlFor={`match-${question.id}-${leftItem.id}`}>
                                                {leftItem.text[language]}
                                            </Label>
                                            {/* Native select styled like the signup form's
                                                level select — reliable RTL + mobile pickers. */}
                                            <select
                                                id={`match-${question.id}-${leftItem.id}`}
                                                value={mapping[leftItem.id] ?? ''}
                                                onChange={(e) =>
                                                    handleMatchChange(leftItem.id, e.target.value)
                                                }
                                                disabled={checked}
                                                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="" disabled>
                                                    {t.matchPlaceholder}
                                                </option>
                                                {payload.right.map((rightItem) => (
                                                    <option key={rightItem.id} value={rightItem.id}>
                                                        {rightItem.text[language]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                </div>

                {checked && (
                    <div
                        className={
                            correctCount === questions.length
                                ? 'rounded-md border border-green-600/30 bg-green-600/10 p-3 text-center text-sm font-medium text-green-700 dark:text-green-400'
                                : 'rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-center text-sm font-medium text-amber-700 dark:text-amber-400'
                        }
                    >
                        {correctCount === questions.length
                            ? t.allCorrect
                            : fillTemplate(t.summaryTemplate, {
                                  correct: String(correctCount),
                                  total: String(questions.length),
                              })}
                    </div>
                )}

                <div className="flex justify-center gap-3">
                    {checked ? (
                        <Button type="button" variant="outline" onClick={handleRetry}>
                            {t.retry}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleCheck}
                            disabled={!answeredAll || isPending}
                        >
                            {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                            {isPending ? t.checking : t.checkAnswers}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
