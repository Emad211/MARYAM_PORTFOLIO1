'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, History, ListChecks, Loader2, Play } from 'lucide-react';
import { formatLocalizedDate, formatLocalizedNumber } from '@/lib/label-utils';
import { startMockSession } from '@/app/actions/exam-actions';
import type { MockExamSummary, MockHistoryEntry } from '@/lib/types';

const content = {
    en: {
        title: 'Mock Exams',
        subtitle: 'Take a timed TestDaF-style simulation and see your estimated band.',
        empty: 'No exams are currently available.',
        minutes: 'min',
        questions: 'questions',
        start: 'Start exam',
        starting: 'Starting...',
        historyTitle: 'Previous attempts',
        emptyHistory: 'No completed attempts yet.',
        failures: {
            unauthorized: 'Please sign in to start the exam.',
            not_found: 'This exam could not be found.',
            empty_exam: 'This exam has no questions yet.',
            start_failed: 'The exam could not be started. Please try again.',
        } as Record<string, string>,
        genericFailure: 'The exam could not be started. Please try again.',
    },
    de: {
        title: 'Probeprüfungen',
        subtitle:
            'Simulieren Sie ein prüfungsnahes TestDaF-Format mit Zeitbegrenzung und sehen Sie Ihre voraussichtliche Einstufung.',
        empty: 'Derzeit sind keine Prüfungen verfügbar.',
        minutes: 'Min.',
        questions: 'Fragen',
        start: 'Prüfung starten',
        starting: 'Wird gestartet...',
        historyTitle: 'Frühere Versuche',
        emptyHistory: 'Noch keine abgeschlossenen Versuche.',
        failures: {
            unauthorized: 'Bitte melden Sie sich an, um die Prüfung zu starten.',
            not_found: 'Diese Prüfung konnte nicht gefunden werden.',
            empty_exam: 'Diese Prüfung enthält noch keine Fragen.',
            start_failed:
                'Die Prüfung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.',
        } as Record<string, string>,
        genericFailure:
            'Die Prüfung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.',
    },
    fa: {
        title: 'آزمون‌های آزمایشی',
        subtitle: 'یک شبیه‌سازی زمان‌دار به سبک TestDaF انجام دهید و سطح تخمینی خود را ببینید.',
        empty: 'در حال حاضر آزمونی موجود نیست.',
        minutes: 'دقیقه',
        questions: 'پرسش',
        start: 'شروع آزمون',
        starting: 'در حال شروع...',
        historyTitle: 'تلاش‌های قبلی',
        emptyHistory: 'هنوز تلاش تکمیل‌شده‌ای ندارید.',
        failures: {
            unauthorized: 'برای شروع آزمون لطفاً وارد شوید.',
            not_found: 'این آزمون پیدا نشد.',
            empty_exam: 'این آزمون هنوز پرسشی ندارد.',
            start_failed: 'شروع آزمون ممکن نشد. لطفاً دوباره تلاش کنید.',
        } as Record<string, string>,
        genericFailure: 'شروع آزمون ممکن نشد. لطفاً دوباره تلاش کنید.',
    },
} as const;

const HISTORY_LIMIT = 5;

export function MockExamList({
    exams,
    history,
}: {
    exams: MockExamSummary[];
    history: MockHistoryEntry[];
}) {
    const { language } = useLanguage();
    const t = content[language];
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [pendingExamId, setPendingExamId] = useState<string | null>(null);

    const handleStart = (exam: MockExamSummary) => {
        setPendingExamId(exam.id);
        startTransition(async () => {
            const result = await startMockSession(exam.id);
            if (!result.success || !result.sessionId) {
                const message = t.failures[result.message] ?? t.genericFailure;
                toast({ variant: 'destructive', description: message });
                setPendingExamId(null);
                return;
            }
            router.push(`/dashboard/exams/${exam.id}/run?sid=${result.sessionId}`);
        });
    };

    const recentHistory = [...history]
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
        .slice(0, HISTORY_LIMIT);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            {exams.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-normal text-muted-foreground">
                            {t.empty}
                        </CardTitle>
                    </CardHeader>
                </Card>
            ) : (
                <div className="space-y-4">
                    {exams.map((exam) => (
                        <Card key={exam.id}>
                            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-headline text-lg font-semibold">
                                            {exam.title[language]}
                                        </h2>
                                        <Badge variant="secondary">{exam.code}</Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {formatLocalizedNumber(
                                                exam.totalDurationMin,
                                                language
                                            )}{' '}
                                            {t.minutes}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <ListChecks className="h-3.5 w-3.5" />
                                            {formatLocalizedNumber(
                                                exam.questionCount,
                                                language
                                            )}{' '}
                                            {t.questions}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleStart(exam)}
                                    disabled={isPending}
                                    className="shrink-0 self-start sm:self-auto"
                                >
                                    {pendingExamId === exam.id && isPending ? (
                                        <>
                                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                            {t.starting}
                                        </>
                                    ) : (
                                        <>
                                            <Play className="me-2 h-4 w-4" />
                                            {t.start}
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <section aria-labelledby="mock-history-heading" className="space-y-3">
                <h2
                    id="mock-history-heading"
                    className="flex items-center gap-2 text-xl font-semibold"
                >
                    <History className="h-5 w-5" />
                    {t.historyTitle}
                </h2>
                {recentHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t.emptyHistory}</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {recentHistory.map((entry) => (
                            <Button key={entry.sessionId} variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/exams/results/${entry.sessionId}`}>
                                    <Badge variant="secondary">
                                        {formatLocalizedNumber(entry.percent, language)}%
                                    </Badge>
                                    {formatLocalizedDate(entry.completedAt, language)}
                                </Link>
                            </Button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
