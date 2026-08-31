'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    Info,
    RotateCcw,
    XCircle,
} from 'lucide-react';
import {
    SKILL_LABELS,
    formatLocalizedDate,
    formatLocalizedNumber,
} from '@/lib/label-utils';
import type {
    JnlAnswer,
    Language,
    LocalizedString,
    MatchAnswer,
    McAnswer,
    MockHistoryEntry,
    MockSessionResults,
    ReviewItem,
} from '@/lib/types';
import type { TdnBand } from '@/lib/exam-blueprints';

const content = {
    en: {
        title: 'Exam Results',
        completedOn: 'Completed',
        overallScore: 'Overall score',
        sectionsHeading: 'Sections',
        reviewHeading: 'Answer Review',
        yourAnswer: 'Your answer',
        correctAnswer: 'Correct answer',
        noAnswer: 'No answer',
        explanationLabel: 'Explanation',
        growthHeading: 'Your progress',
        growthHint: 'Percentage score across your completed attempts.',
        retake: 'Back to exams',
        disclaimer:
            'Estimated band — official thresholds are recalibrated per test form.',
        typeMc: 'Multiple choice',
        typeJnl: 'Yes / No',
        typeMatch: 'Matching',
        jnlOptions: {
            ja: 'Yes',
            nein: 'No',
            nichts: "Doesn't say",
        },
    },
    de: {
        title: 'Prüfungsergebnisse',
        completedOn: 'Abgeschlossen',
        overallScore: 'Gesamtergebnis',
        sectionsHeading: 'Abschnitte',
        reviewHeading: 'Antwortübersicht',
        yourAnswer: 'Ihre Antwort',
        correctAnswer: 'Richtige Antwort',
        noAnswer: 'Keine Antwort',
        explanationLabel: 'Erklärung',
        growthHeading: 'Ihr Fortschritt',
        growthHint: 'Prozentuales Ergebnis Ihrer abgeschlossenen Versuche.',
        retake: 'Zurück zu den Prüfungen',
        disclaimer:
            'Geschätzte Einstufung — die offiziellen Grenzwerte werden pro Prüfungsform neu kalibriert.',
        typeMc: 'Auswahlfrage',
        typeJnl: 'Ja / Nein',
        typeMatch: 'Zuordnung',
        jnlOptions: {
            ja: 'Ja',
            nein: 'Nein',
            nichts: 'Steht nicht im Text',
        },
    },
    fa: {
        title: 'نتایج آزمون',
        completedOn: 'تاریخ اتمام',
        overallScore: 'نتیجه کلی',
        sectionsHeading: 'بخش‌ها',
        reviewHeading: 'مرور پاسخ‌ها',
        yourAnswer: 'پاسخ شما',
        correctAnswer: 'پاسخ درست',
        noAnswer: 'بدون پاسخ',
        explanationLabel: 'توضیح',
        growthHeading: 'پیشرفت شما',
        growthHint: 'درصد نتیجه در تلاش‌های تکمیل‌شده شما.',
        retake: 'بازگشت به آزمون‌ها',
        disclaimer: 'سطح تخمینی — آستانه‌های رسمی برای هر نسخه آزمون دوباره کالیبره می‌شوند.',
        typeMc: 'چهارگزینه‌ای',
        typeJnl: 'بله / خیر',
        typeMatch: 'تطبیق',
        jnlOptions: {
            ja: 'بله',
            nein: 'خیر',
            nichts: 'در متن نیامده',
        },
    },
} as const;

const BAND_LABELS: Record<TdnBand, Record<Language, string>> = {
    unter_tdn3: { en: 'Below TDN 3', de: 'unter TDN 3', fa: 'پایین‌تر از TDN ۳' },
    tdn3: { en: 'TDN 3', de: 'TDN 3', fa: 'TDN ۳' },
    tdn4: { en: 'TDN 4', de: 'TDN 4', fa: 'TDN ۴' },
    tdn5: { en: 'TDN 5', de: 'TDN 5', fa: 'TDN ۵' },
};

const growthConfig = {
    percent: {
        label: '%',
        color: 'hsl(var(--primary))',
    },
} satisfies ChartConfig;

type PlayerAnswer = McAnswer | JnlAnswer | MatchAnswer;

type AnswerLabels = {
    jnlOptions: { ja: string; nein: string; nichts: string };
};

function sameAnswer(a: PlayerAnswer | null, b: PlayerAnswer | null): boolean {
    if (!a || !b) return false;
    return JSON.stringify(a) === JSON.stringify(b);
}

/** questions.explanation is optional (teacher-ease migration) and typed on
 *  LmsQuestion by the parallel types task — narrow structurally so this file
 *  compiles with or without that field on the declared type. */
function explanationFor(question: ReviewItem['question']): LocalizedString | undefined {
    return (
        (question as ReviewItem['question'] & { explanation?: LocalizedString })
            .explanation ?? undefined
    );
}

function ExplanationNote({ label, text }: { label: string; text: string }) {
    return (
        <div className="rounded-e-md border-s-4 border-primary/60 bg-muted p-3 text-sm">
            <div className="flex items-start gap-2">
                <Info
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/70"
                    aria-hidden="true"
                />
                <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {label}
                    </p>
                    <p className="whitespace-pre-line leading-relaxed">{text}</p>
                </div>
            </div>
        </div>
    );
}

/** Resolve an answer object into human-readable text via the question payload. */
function describeAnswer(
    item: ReviewItem,
    answer: PlayerAnswer | null,
    language: Language,
    labels: AnswerLabels
): string | null {
    if (!answer) return null;

    if ('mapping' in answer) {
        const payload =
            item.question.payload && 'left' in item.question.payload
                ? item.question.payload
                : null;
        if (!payload) return null;
        const separator = language === 'fa' ? '، ' : '; ';
        return payload.left
            .map((leftItem) => {
                const rightId = answer.mapping[leftItem.id];
                const right = payload.right.find((r) => r.id === rightId);
                return `${leftItem.text[language]} → ${
                    right ? right.text[language] : '?'
                }`;
            })
            .join(separator);
    }

    if ('correct' in answer) {
        const value = answer.correct;
        if (
            item.question.type === 'jnl' &&
            (value === 'ja' || value === 'nein' || value === 'nichts')
        ) {
            return labels.jnlOptions[value];
        }
        const payload =
            item.question.payload && 'options' in item.question.payload
                ? item.question.payload
                : null;
        const option = payload?.options.find((o) => o.id === value);
        return option ? option.text[language] : value;
    }

    return null;
}

export function MockResults({
    results,
    history,
}: {
    results: MockSessionResults;
    history: MockHistoryEntry[];
}) {
    const { language } = useLanguage();
    const t = content[language];
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

    useEffect(() => {
        setIsClient(true);
    }, []);

    const toggleOpen = (id: string) => {
        setOpenIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const totalRaw = results.sections.reduce((sum, s) => sum + s.raw, 0);
    const totalMax = results.sections.reduce((sum, s) => sum + s.max, 0);
    const overallPercent =
        totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : 0;

    const locale =
        language === 'fa' ? 'fa-IR' : language === 'de' ? 'de-DE' : 'en-US';
    const growthData = [...history]
        .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
        .map((entry) => ({
            date: new Intl.DateTimeFormat(locale, {
                month: 'short',
                day: 'numeric',
            }).format(new Date(entry.completedAt)),
            percent: entry.percent,
        }));

    const typeLabelFor = (item: ReviewItem): string => {
        if (item.question.type === 'mc') return t.typeMc;
        if (item.question.type === 'jnl') return t.typeJnl;
        return t.typeMatch;
    };

    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
                    <Badge variant="secondary">{results.examCode}</Badge>
                </div>
                {results.completedAt && (
                    <p className="text-muted-foreground">
                        {t.completedOn}:{' '}
                        {formatLocalizedDate(results.completedAt, language)}
                    </p>
                )}
            </div>

            <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                    <span className="font-headline text-4xl font-bold tabular-nums">
                        {formatLocalizedNumber(overallPercent, language)}%
                    </span>
                    <Progress
                        value={overallPercent}
                        className="h-2 flex-1"
                        aria-label={t.overallScore}
                    />
                </CardContent>
            </Card>

            <section aria-labelledby="mock-sections-heading" className="space-y-3">
                <h2 id="mock-sections-heading" className="text-xl font-semibold">
                    {t.sectionsHeading}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {results.sections.map((section) => (
                        <Card key={section.sectionId}>
                            <CardHeader className="pb-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <CardTitle className="font-headline text-lg">
                                        {SKILL_LABELS[section.section][language]}
                                    </CardTitle>
                                    <Badge variant="secondary">
                                        {BAND_LABELS[section.band][language]}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Progress
                                    value={
                                        section.max > 0
                                            ? Math.round((section.raw / section.max) * 100)
                                            : 0
                                    }
                                    className="h-2"
                                    aria-label={SKILL_LABELS[section.section][language]}
                                />
                                <p className="text-sm text-muted-foreground">
                                    {formatLocalizedNumber(section.raw, language)} /{' '}
                                    {formatLocalizedNumber(section.max, language)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t.disclaimer}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <section aria-labelledby="mock-review-heading" className="space-y-3">
                <h2 id="mock-review-heading" className="text-xl font-semibold">
                    {t.reviewHeading}
                </h2>
                <div className="space-y-2">
                    {results.review.map((item) => {
                        const open = openIds.has(item.question.id);
                        const givenText = describeAnswer(item, item.given, language, t);
                        const correctText = describeAnswer(
                            item,
                            item.correct,
                            language,
                            t
                        );
                        const isSkipped = item.given === null;
                        const isCorrect =
                            !isSkipped && sameAnswer(item.given, item.correct);
                        const explanationText = explanationFor(item.question)?.[
                            language
                        ];
                        return (
                            <div key={item.question.id} className="rounded-md border">
                                <button
                                    type="button"
                                    onClick={() => toggleOpen(item.question.id)}
                                    aria-expanded={open}
                                    className="flex w-full items-center justify-between gap-3 p-3 text-start"
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <Badge variant="outline" className="shrink-0">
                                            {typeLabelFor(item)}
                                        </Badge>
                                        <span className="truncate text-sm font-medium">
                                            {item.question.prompt[language]}
                                        </span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-2">
                                        {isSkipped ? (
                                            <AlertCircle className="h-5 w-5 text-amber-500" />
                                        ) : isCorrect ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        )}
                                        <ChevronDown
                                            className={`h-4 w-4 transition-transform ${
                                                open ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </span>
                                </button>
                                {open && (
                                    <div className="space-y-2 border-t p-3 text-sm">
                                        <p>
                                            <span className="text-muted-foreground">
                                                {t.yourAnswer}:{' '}
                                            </span>
                                            {isSkipped ? (
                                                <span className="font-medium text-amber-600 dark:text-amber-400">
                                                    {t.noAnswer}
                                                </span>
                                            ) : (
                                                <span>{givenText ?? '—'}</span>
                                            )}
                                        </p>
                                        <p>
                                            <span className="text-muted-foreground">
                                                {t.correctAnswer}:{' '}
                                            </span>
                                            <span className="font-medium">
                                                {correctText ?? '—'}
                                            </span>
                                        </p>
                                        {explanationText && (
                                            <ExplanationNote
                                                label={t.explanationLabel}
                                                text={explanationText}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {growthData.length >= 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t.growthHeading}</CardTitle>
                        <CardDescription>{t.growthHint}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* SSR guard idiom from the admin analytics dashboard —
                            Recharts measures the DOM and must render client-side. */}
                        {isClient && (
                            <ChartContainer
                                config={growthConfig}
                                className="h-[250px] w-full"
                            >
                                <LineChart
                                    accessibilityLayer
                                    data={growthData}
                                    margin={{ left: 12, right: 12 }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Line
                                        dataKey="percent"
                                        type="natural"
                                        stroke="var(--color-percent)"
                                        strokeWidth={2}
                                        dot={true}
                                    />
                                </LineChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-center">
                <Button onClick={() => router.push('/dashboard/exams')}>
                    <RotateCcw className="me-2 h-4 w-4" />
                    {t.retake}
                </Button>
            </div>
        </div>
    );
}
