'use client';

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useTransition,
} from 'react';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Loader2, Mic, Square, Trash2 } from 'lucide-react';
import { formatLocalizedDate, formatLocalizedNumber } from '@/lib/label-utils';
import { createClient } from '@/lib/supabase/browser';
import {
    getMySubmissions,
    submitSpeakingTask,
    submitWritingTask,
} from '@/app/actions/submissions-actions';
import type {
    OpenTask,
    RubricScores,
    SubmissionRecord,
    SubmissionWithTask,
} from '@/lib/types';

const content = {
    en: {
        heading: 'Practice tasks',
        loadingSubmissions: 'Loading your submissions...',
        minutes: 'min',
        wordsUnit: 'words',
        rangeSeparator: '–',
        atLeastWords: 'at least {n} words',
        upToWords: 'up to {n} words',
        skillSchreiben: 'Writing',
        skillSprechen: 'Speaking',
        gradedChip: 'Graded',
        pendingChip: 'In review',
        resubmit: 'Resubmit',
        submittedPrefix: 'Submitted:',
        feedbackHeading: 'Feedback from your teacher',
        writingLabel: 'Your answer',
        writingPlaceholder: 'Write your answer here...',
        wordCount: '{n} words',
        submit: 'Submit',
        submitting: 'Submitting...',
        tooShortTemplate: 'Please write at least {n} words.',
        submittedSuccess: 'Your work was submitted. Your teacher will review it soon.',
        record: 'Record',
        stop: 'Stop',
        discard: 'Discard',
        submitRecording: 'Submit recording',
        uploading: 'Uploading your recording...',
        recordingHint: 'Recording — maximum 5 minutes',
        micDeniedTitle: 'Microphone access denied',
        micDeniedBody:
            'Please allow microphone access in your browser settings and try again.',
        unsupportedTitle: 'Recording not supported',
        unsupportedBody:
            'Audio recording is not available in this browser. Please use a current version of Chrome, Edge, or Firefox.',
        failures: {
            invalid_input: 'Please complete the form before submitting.',
            not_found: 'This task could not be found.',
            too_short: 'Your answer is too short.',
            already_graded:
                'This task was already graded and cannot be resubmitted.',
            forbidden: 'You are not enrolled in this class.',
            submit_failed: 'Your answer could not be submitted. Please try again.',
            unauthorized: 'Please sign in to submit your work.',
            upload_failed: 'Your recording could not be uploaded. Please try again.',
        } as Record<string, string>,
        genericFailure: 'Something went wrong. Please try again.',
    },
    de: {
        heading: 'Übungsaufgaben',
        loadingSubmissions: 'Ihre Abgaben werden geladen...',
        minutes: 'Min.',
        wordsUnit: 'Wörter',
        rangeSeparator: '–',
        atLeastWords: 'mindestens {n} Wörter',
        upToWords: 'bis zu {n} Wörter',
        skillSchreiben: 'Schreiben',
        skillSprechen: 'Sprechen',
        gradedChip: 'Bewertet',
        pendingChip: 'In Prüfung',
        resubmit: 'Erneut einreichen',
        submittedPrefix: 'Abgegeben:',
        feedbackHeading: 'Feedback Ihrer Lehrkraft',
        writingLabel: 'Ihre Antwort',
        writingPlaceholder: 'Schreiben Sie Ihre Antwort hier...',
        wordCount: '{n} Wörter',
        submit: 'Einreichen',
        submitting: 'Wird eingereicht...',
        tooShortTemplate: 'Bitte schreiben Sie mindestens {n} Wörter.',
        submittedSuccess:
            'Ihre Arbeit wurde eingereicht. Ihre Lehrkraft wird sie in Kürze prüfen.',
        record: 'Aufnehmen',
        stop: 'Stopp',
        discard: 'Verwerfen',
        submitRecording: 'Aufnahme einreichen',
        uploading: 'Ihre Aufnahme wird hochgeladen...',
        recordingHint: 'Aufnahme läuft — maximal 5 Minuten',
        micDeniedTitle: 'Mikrofonzugriff verweigert',
        micDeniedBody:
            'Bitte erlauben Sie den Mikrofonzugriff in den Einstellungen Ihres Browsers und versuchen Sie es erneut.',
        unsupportedTitle: 'Aufnahme nicht unterstützt',
        unsupportedBody:
            'Die Audioaufnahme ist in diesem Browser nicht verfügbar. Bitte verwenden Sie eine aktuelle Version von Chrome, Edge oder Firefox.',
        failures: {
            invalid_input: 'Bitte füllen Sie das Formular vollständig aus.',
            not_found: 'Diese Aufgabe konnte nicht gefunden werden.',
            too_short: 'Ihre Antwort ist zu kurz.',
            already_graded:
                'Diese Aufgabe wurde bereits bewertet und kann nicht erneut eingereicht werden.',
            forbidden: 'Sie sind in diesem Kurs nicht eingeschrieben.',
            submit_failed:
                'Ihre Antwort konnte nicht eingereicht werden. Bitte versuchen Sie es erneut.',
            unauthorized: 'Bitte melden Sie sich an, um abzugeben.',
            upload_failed:
                'Ihre Aufnahme konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.',
        } as Record<string, string>,
        genericFailure: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
    },
    fa: {
        heading: 'تمرین‌های نوشتاری و گفتاری',
        loadingSubmissions: 'در حال بارگذاری تکالیف ارسال‌شده شما...',
        minutes: 'دقیقه',
        wordsUnit: 'کلمه',
        rangeSeparator: ' تا ',
        atLeastWords: 'حداقل {n} کلمه',
        upToWords: 'حداکثر {n} کلمه',
        skillSchreiben: 'نوشتن',
        skillSprechen: 'گفتار',
        gradedChip: 'تصحیح‌شده',
        pendingChip: 'در انتظار تصحیح',
        resubmit: 'ارسال دوباره',
        submittedPrefix: 'ارسال‌شده در:',
        feedbackHeading: 'بازخورد مدرس',
        writingLabel: 'پاسخ شما',
        writingPlaceholder: 'پاسخ خود را اینجا بنویسید...',
        wordCount: '{n} کلمه',
        submit: 'ارسال',
        submitting: 'در حال ارسال...',
        tooShortTemplate: 'لطفاً حداقل {n} کلمه بنویسید.',
        submittedSuccess: 'کار شما ارسال شد. مدرس به‌زودی آن را بررسی می‌کند.',
        record: 'ضبط',
        stop: 'توقف',
        discard: 'دور انداختن',
        submitRecording: 'ارسال ضبط',
        uploading: 'در حال بارگذاری ضبط صدا...',
        recordingHint: 'در حال ضبط — حداکثر 5 دقیقه',
        micDeniedTitle: 'دسترسی به میکروفون رد شد',
        micDeniedBody:
            'لطفاً در تنظیمات مرورگر به میکروفون اجازه دسترسی بدهید و دوباره تلاش کنید.',
        unsupportedTitle: 'ضبط صدا پشتیبانی نمی‌شود',
        unsupportedBody:
            'ضبط صدا در این مرورگر موجود نیست. لطفاً از نسخه به‌روز کروم، اج یا فایرفاکس استفاده کنید.',
        failures: {
            invalid_input: 'لطفاً فرم را کامل پر کنید.',
            not_found: 'این تکلیف پیدا نشد.',
            too_short: 'پاسخ شما خیلی کوتاه است.',
            already_graded: 'این تکلیف قبلاً تصحیح شده و امکان ارسال مجدد نیست.',
            forbidden: 'شما در این دوره ثبت‌نام نکرده‌اید.',
            submit_failed: 'ارسال پاسخ شما ممکن نشد. لطفاً دوباره تلاش کنید.',
            unauthorized: 'برای ارسال تکلیف لطفاً وارد شوید.',
            upload_failed: 'بارگذاری ضبط صدا ممکن نشد. لطفاً دوباره تلاش کنید.',
        } as Record<string, string>,
        genericFailure: 'مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
    },
} as const;

/** TestDaF-style rubric terminology — kept in German across all UI languages. */
const RUBRIC_LABELS: Record<keyof RubricScores, string> = {
    wirkung: 'Wirkung',
    aufgabe: 'Aufgabenstellung',
    sprache: 'Sprache',
};

/** Hard auto-stop for recordings (5 minutes). */
const MAX_RECORDING_SECONDS = 300;
const MAX_TEXT_LENGTH = 20000;

type RecorderState =
    | 'idle'
    | 'denied'
    | 'unsupported'
    | 'recording'
    | 'recorded'
    | 'uploading';

function fillTemplate(template: string, values: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Red below the minimum, green within range, amber above the maximum —
 *  exceeding the maximum warns but never blocks submission. */
function wordCountClass(
    count: number,
    min?: number | undefined,
    max?: number | undefined
): string {
    if (typeof min === 'number' && count < min) return 'text-red-600 dark:text-red-400';
    if (typeof max === 'number' && count > max) return 'text-amber-600 dark:text-amber-400';
    if (typeof min === 'number') return 'text-green-700 dark:text-green-400';
    return 'text-muted-foreground';
}

function formatElapsed(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function isRecorderSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof MediaRecorder !== 'undefined' &&
        Boolean(navigator.mediaDevices?.getUserMedia)
    );
}

/** Prefer WebM/Opus (the storage contract pins contentType audio/webm);
 *  fall back to the browser default recorder when no WebM profile exists. */
function pickMimeType(): string | undefined {
    if (typeof MediaRecorder === 'undefined') return undefined;
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        return 'audio/webm;codecs=opus';
    }
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    return undefined;
}

export function OpenTasksSection({ tasks }: { tasks: OpenTask[] }) {
    const { language } = useLanguage();
    const t = content[language];
    const [submissions, setSubmissions] = useState<Map<string, SubmissionWithTask>>(
        () => new Map()
    );
    const [loaded, setLoaded] = useState(false);

    const reload = useCallback(async () => {
        try {
            const rows = await getMySubmissions();
            setSubmissions(new Map(rows.map((row) => [row.taskId, row] as const)));
        } catch {
            // Keep previous state; the cards still render their current view.
        } finally {
            setLoaded(true);
        }
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    const handleSubmitted = useCallback(
        (submission: SubmissionWithTask) => {
            // Optimistic: flip this task to "pending" immediately, then let the
            // reload reconcile with the server copy.
            setSubmissions((prev) => new Map(prev).set(submission.taskId, submission));
            void reload();
        },
        [reload]
    );

    const sortedTasks = useMemo(
        () => [...tasks].sort((a, b) => a.sortOrder - b.sortOrder),
        [tasks]
    );

    return (
        <section className="space-y-4" aria-label={t.heading}>
            <h2 className="font-headline text-xl font-bold">{t.heading}</h2>
            {!loaded && (
                <p className="text-sm text-muted-foreground">{t.loadingSubmissions}</p>
            )}
            {sortedTasks.map((task) => (
                <OpenTaskCard
                    key={task.id}
                    task={task}
                    submission={submissions.get(task.id) ?? null}
                    onSubmitted={handleSubmitted}
                />
            ))}
        </section>
    );
}

function OpenTaskCard({
    task,
    submission,
    onSubmitted,
}: {
    task: OpenTask;
    submission: SubmissionWithTask | null;
    onSubmitted: (submission: SubmissionWithTask) => void;
}) {
    const { language } = useLanguage();
    const t = content[language];
    const [editing, setEditing] = useState(false);

    const paragraphs = task.prompt[language]
        .split('\n\n')
        .filter((paragraph) => paragraph.trim().length > 0);

    const skillLabel = task.skill === 'schreiben' ? t.skillSchreiben : t.skillSprechen;

    const { wordMin, wordMax } = task;
    let wordRangeLabel: string | null = null;
    if (typeof wordMin === 'number' && typeof wordMax === 'number') {
        wordRangeLabel = `${wordMin}${t.rangeSeparator}${wordMax} ${t.wordsUnit}`;
    } else if (typeof wordMin === 'number') {
        wordRangeLabel = fillTemplate(t.atLeastWords, { n: String(wordMin) });
    } else if (typeof wordMax === 'number') {
        wordRangeLabel = fillTemplate(t.upToWords, { n: String(wordMax) });
    }

    /** Optimistic pending record — optional fields stay absent entirely
     *  (exactOptionalPropertyTypes-safe). */
    const buildPendingSubmission = (
        kind: 'text' | 'audio',
        payload: string
    ): SubmissionWithTask => {
        const record: SubmissionRecord =
            kind === 'text'
                ? {
                      id: `pending-${task.id}`,
                      taskId: task.id,
                      kind: 'text',
                      body: payload,
                      status: 'pending',
                      submittedAt: new Date().toISOString(),
                  }
                : {
                      id: `pending-${task.id}`,
                      taskId: task.id,
                      kind: 'audio',
                      filePath: payload,
                      status: 'pending',
                      submittedAt: new Date().toISOString(),
                  };
        return { ...record, task };
    };

    const showForm = !submission || editing;

    return (
        <Card>
            <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{skillLabel}</Badge>
                    {typeof task.timeLimitMin === 'number' && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {formatLocalizedNumber(task.timeLimitMin, language)}{' '}
                            {t.minutes}
                        </span>
                    )}
                    {wordRangeLabel && (
                        <span className="text-xs text-muted-foreground">
                            {wordRangeLabel}
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    {paragraphs.map((paragraph, index) => (
                        <p
                            key={index}
                            className="whitespace-pre-line text-base leading-relaxed"
                        >
                            {paragraph}
                        </p>
                    ))}
                </div>

                {showForm ? (
                    task.skill === 'schreiben' ? (
                        <WritingTaskForm
                            task={task}
                            onDone={(body) => {
                                setEditing(false);
                                onSubmitted(buildPendingSubmission('text', body));
                            }}
                        />
                    ) : (
                        <SpeakingTaskForm
                            task={task}
                            onDone={(filePath) => {
                                setEditing(false);
                                onSubmitted(buildPendingSubmission('audio', filePath));
                            }}
                        />
                    )
                ) : submission ? (
                    <SubmissionPanel
                        submission={submission}
                        onResubmit={() => setEditing(true)}
                    />
                ) : null}
            </CardContent>
        </Card>
    );
}

function SubmissionPanel({
    submission,
    onResubmit,
}: {
    submission: SubmissionWithTask;
    onResubmit: () => void;
}) {
    const { language } = useLanguage();
    const t = content[language];

    if (submission.status === 'graded') {
        const rubricEntries = submission.rubricScores
            ? (Object.entries(submission.rubricScores) as [
                  keyof RubricScores,
                  number,
              ][])
            : [];

        return (
            <div className="space-y-3 rounded-md border border-green-600/40 bg-green-600/5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-green-600 text-white hover:bg-green-600">
                        {t.gradedChip}
                    </Badge>
                    {rubricEntries.map(([key, score]) => (
                        <Badge
                            key={key}
                            variant="outline"
                            className="border-green-600/40 text-green-700 dark:text-green-400"
                        >
                            {RUBRIC_LABELS[key]} {formatLocalizedNumber(score, language)}
                            /5
                        </Badge>
                    ))}
                </div>

                {submission.teacherFeedback && (
                    <div className="space-y-1">
                        <p className="text-sm font-medium">{t.feedbackHeading}</p>
                        <blockquote
                            dir="auto"
                            className="whitespace-pre-line border-s-2 border-green-600/60 ps-3 text-sm leading-relaxed"
                        >
                            {submission.teacherFeedback}
                        </blockquote>
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    {t.submittedPrefix}{' '}
                    {formatLocalizedDate(submission.submittedAt, language)}
                </p>

                <Button variant="outline" size="sm" onClick={onResubmit}>
                    {t.resubmit}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-4">
            <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                {t.pendingChip}
            </Badge>
            <p className="text-xs text-muted-foreground">
                {t.submittedPrefix} {formatLocalizedDate(submission.submittedAt, language)}
            </p>
            <Button variant="outline" size="sm" onClick={onResubmit}>
                {t.resubmit}
            </Button>
        </div>
    );
}

function WritingTaskForm({
    task,
    onDone,
}: {
    task: OpenTask;
    onDone: (body: string) => void;
}) {
    const { language } = useLanguage();
    const t = content[language];
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [text, setText] = useState('');

    const words = countWords(text);
    const counterClass = wordCountClass(words, task.wordMin, task.wordMax);

    const handleSubmit = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set('taskId', task.id);
            formData.set('body', text);
            const result = await submitWritingTask(formData);
            if (!result.success || result.message !== 'submitted') {
                const message =
                    result.message === 'too_short'
                        ? fillTemplate(t.tooShortTemplate, {
                              n: String(task.wordMin ?? 0),
                          })
                        : (t.failures[result.message] ?? t.genericFailure);
                toast({ variant: 'destructive', description: message });
                return;
            }
            toast({ description: t.submittedSuccess });
            onDone(text);
        });
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={`open-task-${task.id}`}>{t.writingLabel}</Label>
            <Textarea
                id={`open-task-${task.id}`}
                rows={10}
                dir="auto"
                maxLength={MAX_TEXT_LENGTH}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={t.writingPlaceholder}
                disabled={isPending}
            />
            <div className="flex items-center justify-end gap-3">
                <span className={`text-xs ${counterClass}`} aria-live="polite">
                    {fillTemplate(t.wordCount, { n: String(words) })}
                </span>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending || text.trim().length === 0}
                >
                    {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    {isPending ? t.submitting : t.submit}
                </Button>
            </div>
        </div>
    );
}

function SpeakingTaskForm({
    task,
    onDone,
}: {
    task: OpenTask;
    onDone: (filePath: string) => void;
}) {
    const { language } = useLanguage();
    const t = content[language];
    const { toast } = useToast();
    const { user } = useAuth();
    const [isPending, startTransition] = useTransition();

    const [recorderState, setRecorderState] = useState<RecorderState>('idle');
    const [elapsed, setElapsed] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const blobRef = useRef<Blob | null>(null);
    const urlRef = useRef<string | null>(null);
    const timerRef = useRef<number | null>(null);
    const startedAtRef = useRef<number>(0);

    const clearTimer = () => {
        if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const revokeAudioUrl = () => {
        if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
            urlRef.current = null;
        }
    };

    // Release the microphone and the object URL when the card unmounts.
    useEffect(() => {
        return () => {
            if (timerRef.current !== null) window.clearInterval(timerRef.current);
            streamRef.current?.getTracks().forEach((track) => track.stop());
            if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        };
    }, []);

    const stopRecording = () => {
        clearTimer();
        const recorder = recorderRef.current;
        if (recorder && recorder.state === 'recording') recorder.stop();
    };

    const discardRecording = () => {
        clearTimer();
        blobRef.current = null;
        revokeAudioUrl();
        setAudioUrl(null);
        setElapsed(0);
        setRecorderState('idle');
    };

    const startRecording = async () => {
        if (!isRecorderSupported()) {
            setRecorderState('unsupported');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            chunksRef.current = [];
            const mimeType = pickMimeType();
            const recorder = new MediaRecorder(
                stream,
                mimeType ? { mimeType } : undefined
            );
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunksRef.current.push(event.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                blobRef.current = blob;
                revokeAudioUrl();
                const url = URL.createObjectURL(blob);
                urlRef.current = url;
                setAudioUrl(url);
                stream.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
                setRecorderState('recorded');
            };
            recorderRef.current = recorder;
            recorder.start();
            startedAtRef.current = Date.now();
            setElapsed(0);
            setRecorderState('recording');
            timerRef.current = window.setInterval(() => {
                const seconds = Math.floor(
                    (Date.now() - startedAtRef.current) / 1000
                );
                setElapsed(seconds);
                if (seconds >= MAX_RECORDING_SECONDS) stopRecording();
            }, 1000);
        } catch {
            setRecorderState('denied');
        }
    };

    const handleSubmitRecording = () => {
        const blob = blobRef.current;
        if (!user || !blob) return;
        setRecorderState('uploading');
        startTransition(async () => {
            const path = `${user.id}/${task.id}/${Date.now()}.webm`;
            const { error: uploadError } = await createClient()
                .storage.from('submissions')
                .upload(path, blob, { contentType: 'audio/webm' });
            if (uploadError) {
                toast({
                    variant: 'destructive',
                    description: t.failures.upload_failed ?? t.genericFailure,
                });
                setRecorderState('recorded');
                return;
            }

            const formData = new FormData();
            formData.set('taskId', task.id);
            formData.set('filePath', path);
            const result = await submitSpeakingTask(formData);
            if (!result.success || result.message !== 'submitted') {
                toast({
                    variant: 'destructive',
                    description: t.failures[result.message] ?? t.genericFailure,
                });
                setRecorderState('recorded');
                return;
            }

            toast({ description: t.submittedSuccess });
            discardRecording();
            onDone(path);
        });
    };

    return (
        <div className="space-y-3">
            {recorderState === 'unsupported' && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
                    <p className="font-medium">{t.unsupportedTitle}</p>
                    <p>{t.unsupportedBody}</p>
                </div>
            )}

            {recorderState === 'denied' && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <p className="font-medium">{t.micDeniedTitle}</p>
                    <p>{t.micDeniedBody}</p>
                </div>
            )}

            {recorderState === 'recording' && (
                <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
                    <span
                        className="h-3 w-3 animate-pulse rounded-full bg-red-500"
                        aria-hidden="true"
                    />
                    <span className="font-mono text-sm tabular-nums">
                        {formatElapsed(elapsed)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {t.recordingHint}
                    </span>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={stopRecording}
                    >
                        <Square className="me-2 h-4 w-4" />
                        {t.stop}
                    </Button>
                </div>
            )}

            {(recorderState === 'recorded' || recorderState === 'uploading') &&
                audioUrl && (
                    <div className="space-y-3">
                        <audio controls src={audioUrl} className="w-full" />
                        {recorderState === 'uploading' || isPending ? (
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t.uploading}
                            </p>
                        ) : (
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={discardRecording}
                                >
                                    <Trash2 className="me-2 h-4 w-4" />
                                    {t.discard}
                                </Button>
                                <Button type="button" onClick={handleSubmitRecording}>
                                    {t.submitRecording}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

            {recorderState === 'idle' && (
                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={() => {
                            void startRecording();
                        }}
                        disabled={!user}
                    >
                        <Mic className="me-2 h-4 w-4" />
                        {t.record}
                    </Button>
                </div>
            )}
        </div>
    );
}
