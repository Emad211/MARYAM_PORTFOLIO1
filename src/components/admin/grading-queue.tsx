"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2, PartyPopper, PlayCircle } from "lucide-react";
import {
  gradeSubmission,
  getSubmissionAudioUrl,
} from "@/app/actions/submissions-actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/empty-state";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import type { Language } from "@/lib/types";

// --- Queue item shape (mapped from DB rows by the server page) ---
// Structurally identical to RubricScores in @/lib/types; kept local so this
// file stays self-contained against the parallel-owned types module.

export interface AdminRubricScores {
  wirkung: number;
  aufgabe: number;
  sprache: number;
}

export interface AdminSubmissionItem {
  id: string;
  kind: "text" | "audio";
  body?: string;
  status: "pending" | "graded";
  submittedAt: string;
  teacherFeedback?: string;
  rubricScores?: AdminRubricScores;
  studentName: string;
  task: {
    skill: "schreiben" | "sprechen";
    prompt: { en: string; de: string; fa: string };
    timeLimitMin?: number;
    wordMin?: number;
    wordMax?: number;
  };
}

// --- Constants ---

const PROMPT_LANGS = ["en", "de", "fa"] as const;
const LANG_LABEL: Record<(typeof PROMPT_LANGS)[number], string> = {
  en: "EN",
  de: "DE",
  fa: "FA",
};

const RUBRIC_VALUES = ["1", "2", "3", "4", "5"] as const;
type RubricKey = keyof AdminRubricScores;

// German rubric terms stay primary (owner requirement); the gloss line localizes them.
const RUBRIC_FIELDS: Array<{
  key: RubricKey;
  term: string;
  gloss: Record<Language, string>;
  scale: Record<Language, string>;
}> = [
  {
    key: "wirkung",
    term: "Wirkung",
    gloss: { en: "Impact on the reader", de: "Wirkung auf den Leser", fa: "تأثیر بر خواننده" },
    scale: { en: "1 weak … 5 excellent", de: "1 schwach … 5 hervorragend", fa: "از ۱ ضعیف تا ۵ عالی" },
  },
  {
    key: "aufgabe",
    term: "Aufgabenstellung",
    gloss: { en: "Task fulfilment", de: "Aufgabenerfüllung", fa: "انجام تکلیف" },
    scale: { en: "1 weak … 5 excellent", de: "1 schwach … 5 hervorragend", fa: "از ۱ ضعیف تا ۵ عالی" },
  },
  {
    key: "sprache",
    term: "Sprachliche Mittel",
    gloss: { en: "Language use", de: "Sprachliche Mittel", fa: "زبان" },
    scale: { en: "1 weak … 5 excellent", de: "1 schwach … 5 hervorragend", fa: "از ۱ ضعیف تا ۵ عالی" },
  },
];

const INTL_LOCALE: Record<Language, string> = { en: "en-US", de: "de-DE", fa: "fa-IR" };

const ui = {
  en: {
    title: "Grading Queue",
    subtitle:
      "Review student Schreiben/Sprechen submissions and grade them with the official three-criterion rubric.",
    pendingLabel: "Pending",
    gradedLabel: "Graded",
    empty: "Nothing to grade right now 🎉",
    emptySub: "New submissions will appear here automatically.",
    taskPrompt: "Task prompt",
    minUnit: "min",
    wordsUnit: "words",
    noText: "No text was submitted.",
    loading: "Loading…",
    loadRecording: "Load recording",
    audioFailed: "Recording could not be loaded.",
    scorePlaceholder: "Score",
    feedback: "Feedback",
    feedbackPlaceholder: "Specific, encouraging feedback with corrections…",
    gradeAction: "Grade submission",
    gradedToast: "Submission graded.",
    actionFailed: "Action failed",
    failures: {
      invalid_input: "All three rubric scores and feedback text are required.",
      not_found: "This submission no longer exists.",
      unauthorized: "Your session is not authorized to grade.",
      already_graded: "This submission was already graded.",
    } as Record<string, string>,
  },
  de: {
    title: "Bewertungen",
    subtitle:
      "Prüfen Sie die Schreiben-/Sprechen-Aufgaben der Studierenden und bewerten Sie sie mit der offiziellen dreiteiligen Rubrik.",
    pendingLabel: "Ausstehend",
    gradedLabel: "Bewertet",
    empty: "Aktuell gibt es nichts zu korrigieren 🎉",
    emptySub: "Neue Abgaben erscheinen hier automatisch.",
    taskPrompt: "Aufgabenstellung",
    minUnit: "Min.",
    wordsUnit: "Wörter",
    noText: "Es wurde kein Text eingereicht.",
    loading: "Lädt…",
    loadRecording: "Aufnahme laden",
    audioFailed: "Die Aufnahme konnte nicht geladen werden.",
    scorePlaceholder: "Note",
    feedback: "Rückmeldung",
    feedbackPlaceholder: "Konkrete, ermutigende Rückmeldung mit Korrekturen …",
    gradeAction: "Bewertung speichern",
    gradedToast: "Abgabe bewertet.",
    actionFailed: "Aktion fehlgeschlagen",
    failures: {
      invalid_input: "Alle drei Rubrikwerte und der Rückmeldetext sind erforderlich.",
      not_found: "Diese Abgabe existiert nicht mehr.",
      unauthorized: "Ihre Sitzung ist nicht zum Bewerten berechtigt.",
      already_graded: "Diese Abgabe wurde bereits bewertet.",
    } as Record<string, string>,
  },
  fa: {
    title: "صف تصحیح",
    subtitle:
      "تکالیف نوشتار (Schreiben) و گفتار (Sprechen) هنرجویان را بررسی کنید و با معیار سه‌گانه رسمی نمره‌دهی کنید.",
    pendingLabel: "در انتظار تصحیح",
    gradedLabel: "تصحیح‌شده",
    empty: "فعلاً چیزی برای تصحیح نیست 🎉",
    emptySub: "تکالیف جدید خودکار در این صفحه نمایش داده می‌شوند.",
    taskPrompt: "متن تکلیف",
    minUnit: "دقیقه",
    wordsUnit: "کلمه",
    noText: "متنی ارسال نشده است.",
    loading: "در حال بارگذاری…",
    loadRecording: "پخش فایل صوتی",
    audioFailed: "فایل صوتی بارگذاری نشد.",
    scorePlaceholder: "نمره",
    feedback: "بازخورد",
    feedbackPlaceholder: "بازخورد مشخص و دلگرم‌کننده با اصلاحات بنویسید…",
    gradeAction: "ثبت نمره",
    gradedToast: "نمره ثبت شد.",
    actionFailed: "انجام عملیات ناموفق بود",
    failures: {
      invalid_input: "هر سه نمرهٔ معیار و متن بازخورد الزامی است.",
      not_found: "این تکلیف دیگر وجود ندارد.",
      unauthorized: "اجازهٔ تصحیح ندارید.",
      already_graded: "این تکلیف قبلاً تصحیح شده است.",
    } as Record<string, string>,
  },
} as const;

function formatSubmittedAt(iso: string, language: Language): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString(INTL_LOCALE[language]);
}

// --- Root queue ---

export function GradingQueue({ items }: { items: AdminSubmissionItem[] }) {
  const { language } = useLanguage();
  const t = ui[language];
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const pendingCount = items.filter((item) => item.status === "pending").length;
  const gradedCount = items.length - pendingCount;

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          en={ui.en.empty}
          de={ui.de.empty}
          fa={ui.fa.empty}
          subEn={ui.en.emptySub}
          subDe={ui.de.emptySub}
          subFa={ui.fa.emptySub}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              {t.pendingLabel} {pendingCount}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {t.gradedLabel} {gradedCount}
            </span>
          </div>

          {items.map((item) => (
            <SubmissionCard
              key={item.id}
              item={item}
              open={expandedIds.has(item.id)}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Submission card ---

interface SubmissionCardProps {
  item: AdminSubmissionItem;
  open: boolean;
  onToggle: () => void;
}

function SubmissionCard({ item, open, onToggle }: SubmissionCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = ui[language];
  const [isPending, startTransition] = useTransition();
  const [isLoadingAudio, startLoadingAudio] = useTransition();

  // Audio playback — signed URL fetched lazily on demand, revoked when the
  // card collapses / the recording is replaced / the card unmounts.
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFailed, setAudioFailed] = useState(false);
  const audioUrlRef = useRef<string | null>(null);

  const revokeCurrentAudio = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioUrl(null);
    setAudioFailed(false);
  };

  const handleLoadRecording = () => {
    startLoadingAudio(() => {
      void (async () => {
        const url = await getSubmissionAudioUrl(item.id);
        if (url) {
          revokeCurrentAudio();
          audioUrlRef.current = url;
          setAudioUrl(url);
        } else {
          setAudioFailed(true);
        }
      })();
    });
  };

  // Collapse always drops the player — revoke there too.
  const handleToggle = () => {
    if (open) revokeCurrentAudio();
    onToggle();
  };

  // If a refresh flips this card to graded while expanded, the form (and its
  // audio player) unmounts — drop any lingering URL.
  useEffect(() => {
    if (item.status === "graded") revokeCurrentAudio();
  }, [item.status]);

  // Final safety net on unmount.
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  // Grading form state.
  const [scores, setScores] = useState<Record<RubricKey, string>>({
    wirkung: "",
    aufgabe: "",
    sprache: "",
  });
  const [feedback, setFeedback] = useState("");

  const formComplete =
    RUBRIC_FIELDS.every((field) => scores[field.key] !== "") &&
    feedback.trim().length > 0;

  const handleGrade = () => {
    if (!formComplete) return;
    const fd = new FormData();
    fd.set("submissionId", item.id);
    fd.set("feedback", feedback);
    fd.set("wirkung", scores.wirkung);
    fd.set("aufgabe", scores.aufgabe);
    fd.set("sprache", scores.sprache);

    startTransition(() => {
      void (async () => {
        const result = await gradeSubmission(fd);
        if (result.success) {
          toast({ title: t.gradedToast });
          router.refresh(); // list re-renders from the server, pending-first
        } else {
          toast({
            variant: "destructive",
            title: t.actionFailed,
            description: t.failures[result.message] ?? result.message,
          });
        }
      })();
    });
  };

  const taskMeta = [
    ...(item.task.timeLimitMin != null ? [`${item.task.timeLimitMin} ${t.minUnit}`] : []),
    ...(item.task.wordMin != null || item.task.wordMax != null
      ? [`${item.task.wordMin ?? "?"}–${item.task.wordMax ?? "?"} ${t.wordsUnit}`]
      : []),
  ].join(" · ");

  return (
    <Card className="border-2">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={open}
          className="flex flex-1 items-center gap-2 text-start"
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
          />
          <span className="min-w-0">
            <CardTitle className="truncate text-base">{item.studentName}</CardTitle>
            <span className="block text-xs text-muted-foreground">
              {formatSubmittedAt(item.submittedAt, language)}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className="hover:bg-accent">
            {item.task.skill === "schreiben" ? "Schreiben" : "Sprechen"}
          </Badge>
          {item.status === "pending" ? (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300">
              {t.pendingLabel}
            </Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300">
              {t.gradedLabel}
            </Badge>
          )}
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 border-t pt-4">
          {/* Task prompt — trilingual stacked muted blocks */}
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-sm font-medium">{t.taskPrompt}</div>
              {taskMeta && (
                <div className="text-xs text-muted-foreground">{taskMeta}</div>
              )}
            </div>
            {PROMPT_LANGS.map((lang) => (
              <p
                key={lang}
                dir={lang === "fa" ? "rtl" : "ltr"}
                className="whitespace-pre-wrap text-sm text-muted-foreground"
              >
                <span className="me-2 text-xs font-semibold uppercase">{LANG_LABEL[lang]}</span>
                {item.task.prompt[lang]}
              </p>
            ))}
          </div>

          {/* Student work */}
          {item.kind === "text" ? (
            item.body ? (
              <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
                {item.body}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t.noText}</p>
            )
          ) : audioUrl ? (
            <audio controls src={audioUrl} className="w-full" />
          ) : isLoadingAudio ? (
            <Button variant="outline" disabled>
              <Loader2 className="me-1 h-4 w-4 animate-spin" />
              {t.loading}
            </Button>
          ) : audioFailed ? (
            <p className="text-sm text-destructive">{t.audioFailed}</p>
          ) : (
            <Button variant="outline" onClick={handleLoadRecording}>
              <PlayCircle className="me-1 h-4 w-4" />
              {t.loadRecording}
            </Button>
          )}

          {/* Graded → read-only rubric + feedback */}
          {item.status === "graded" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {RUBRIC_FIELDS.map(({ key, term, gloss }) => (
                  <div key={key} className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-muted-foreground">{term}</div>
                    <div className="text-xs text-muted-foreground">{gloss[language]}</div>
                    <div className="text-2xl font-bold">{item.rubricScores?.[key] ?? "–"} / 5</div>
                  </div>
                ))}
              </div>
              {item.teacherFeedback && (
                <blockquote className="border-s-2 border-primary ps-3 text-sm italic">
                  {item.teacherFeedback}
                </blockquote>
              )}
            </>
          ) : (
            /* Pending → inline grading form */
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {RUBRIC_FIELDS.map(({ key, term, gloss, scale }) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`${item.id}-${key}`}>{term}</Label>
                    <Select
                      value={scores[key]}
                      onValueChange={(value) =>
                        setScores((prev) => ({ ...prev, [key]: value }))
                      }
                    >
                      <SelectTrigger id={`${item.id}-${key}`}>
                        <SelectValue placeholder={t.scorePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {RUBRIC_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {gloss[language]} — {scale[language]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <Label htmlFor={`${item.id}-feedback`}>{t.feedback}</Label>
                <Textarea
                  id={`${item.id}-feedback`}
                  rows={6}
                  minLength={1}
                  placeholder={t.feedbackPlaceholder}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleGrade} disabled={isPending || !formComplete}>
                  {isPending ? (
                    <Loader2 className="me-1 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="me-1 h-4 w-4" />
                  )}
                  {t.gradeAction}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
