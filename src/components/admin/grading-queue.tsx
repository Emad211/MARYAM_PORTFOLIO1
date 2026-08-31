"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2, PartyPopper, PlayCircle, Trash2 } from "lucide-react";
import {
  deleteSubmissionAnnotation,
  getSubmissionAnnotations,
  gradeSubmission,
  getSubmissionAudioUrl,
  saveSubmissionAnnotation,
} from "@/app/actions/submissions-actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Mirrors SubmissionAnnotation from @/lib/types (parallel-owned) — kept local
// for the same self-containment reason as the types above. Offsets are
// character offsets into the submission body rendered as LTR plain text.
export interface AdminSubmissionAnnotation {
  id: string;
  submissionId: string;
  startOffset: number;
  endOffset: number;
  comment: string;
  createdAt: string;
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

/** SLA window for responding to a submission (48 hours, in ms). */
const SLA_MS = 48 * 60 * 60 * 1000;

/**
 * Korrekturzeichen quick-insert snippets. Labels follow the UI language; the
 * inserted text is always the canonical correction code / German phrase so
 * the feedback stays consistent for German learners across UI languages.
 */
const SNIPPETS: Array<{ insert: string; label: Record<Language, string> }> = [
  { insert: "[Gr] ", label: { en: "Grammar", de: "Grammatik", fa: "گرامر" } },
  { insert: "[Or] ", label: { en: "Spelling", de: "Orthographie", fa: "املا" } },
  { insert: "[W] ", label: { en: "Vocabulary", de: "Wortschatz", fa: "واژه" } },
  { insert: "[Str] ", label: { en: "Structure", de: "Struktur", fa: "ساختار" } },
  { insert: "Sehr gut! ", label: { en: "Very good!", de: "Sehr gut!", fa: "خیلی خوب!" } },
  {
    insert: "Formulieren Sie das um. ",
    label: { en: "Rephrase this", de: "Formulieren Sie das um", fa: "اینجا را دوباره بنویس" },
  },
];

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
    slaTarget: "Target: reply within 48h",
    slaOverdue: "48h overdue!",
    snippetLabel: "Correction codes",
    annotateHint:
      "Select text in the submission to comment on it. Click a highlight to view or delete its note.",
    commentPlaceholder: "Comment on this section…",
    saveAnnotation: "Save note",
    deleteAnnotation: "Delete note",
    annotationSaved: "Note saved.",
    annotationDeleted: "Note deleted.",
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
      save_failed: "The note could not be saved.",
      delete_failed: "The note could not be deleted.",
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
    slaTarget: "Ziel: Rückmeldung in 48h",
    slaOverdue: "48h überschritten!",
    snippetLabel: "Korrekturzeichen",
    annotateHint:
      "Markieren Sie Text in der Abgabe, um ihn zu kommentieren. Klicken Sie auf eine Markierung, um die Notiz zu sehen oder zu löschen.",
    commentPlaceholder: "Anmerkung zu dieser Stelle …",
    saveAnnotation: "Anmerkung speichern",
    deleteAnnotation: "Anmerkung löschen",
    annotationSaved: "Anmerkung gespeichert.",
    annotationDeleted: "Anmerkung gelöscht.",
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
      save_failed: "Die Anmerkung konnte nicht gespeichert werden.",
      delete_failed: "Die Anmerkung konnte nicht gelöscht werden.",
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
    slaTarget: "⏳ هدف: پاسخ تا ۴۸ ساعت",
    slaOverdue: "۴۸ ساعت گذشته!",
    snippetLabel: "کدهای اصلاح",
    annotateHint:
      "برای نظر دادن، بخشی از متن هنرجو را با ماوس انتخاب کنید. با کلیک روی هر هایلایت، نظر آن را ببینید یا حذف کنید.",
    commentPlaceholder: "نظر روی این بخش…",
    saveAnnotation: "ثبت نظر",
    deleteAnnotation: "حذف نظر",
    annotationSaved: "نظر روی متن ثبت شد.",
    annotationDeleted: "نظر حذف شد.",
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
      save_failed: "ذخیرهٔ نظر روی متن ناموفق بود.",
      delete_failed: "حذف نظر ناموفق بود.",
    } as Record<string, string>,
  },
} as const;

function formatSubmittedAt(iso: string, language: Language): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString(INTL_LOCALE[language]);
}

// --- Inline annotation editor over the student text ---

interface PendingSelection {
  start: number;
  end: number;
  top: number;
  left: number;
}

interface TextSegment {
  text: string;
  annotation?: AdminSubmissionAnnotation;
}

/**
 * Splits the body into plain/annotated segments. Overlapping or out-of-range
 * annotations are clamped and skipped conservatively so rendering can never
 * throw or double-render a character.
 */
function buildSegments(
  body: string,
  annotations: AdminSubmissionAnnotation[]
): TextSegment[] {
  const sorted = [...annotations]
    .map((a) => ({
      a,
      start: Math.max(0, Math.min(a.startOffset, body.length)),
      end: Math.max(0, Math.min(a.endOffset, body.length)),
    }))
    .filter(({ start, end }) => end > start)
    .sort((x, y) => x.start - y.start || y.end - x.end);

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const { a, start, end } of sorted) {
    if (start < cursor) continue;
    if (start > cursor) segments.push({ text: body.slice(cursor, start) });
    segments.push({ text: body.slice(start, end), annotation: a });
    cursor = end;
  }
  if (cursor < body.length) segments.push({ text: body.slice(cursor) });
  return segments;
}

function AnnotatedText({ submissionId, body }: { submissionId: string; body: string }) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = ui[language];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const createPopoverRef = useRef<HTMLDivElement | null>(null);
  const viewPopoverRef = useRef<HTMLDivElement | null>(null);
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const [annotations, setAnnotations] = useState<AdminSubmissionAnnotation[]>([]);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [comment, setComment] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePos, setActivePos] = useState<{ top: number; left: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAnnotations([]);
    void (async () => {
      const list = await getSubmissionAnnotations(submissionId);
      if (!cancelled) setAnnotations(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  useEffect(() => {
    if (pending) commentInputRef.current?.focus();
  }, [pending]);

  const segments = useMemo(() => buildSegments(body, annotations), [body, annotations]);

  const activeAnnotation =
    activeId === null ? undefined : annotations.find((a) => a.id === activeId);

  const hideCreatePopover = () => {
    setPending(null);
    setComment("");
  };

  const hideViewPopover = () => {
    setActiveId(null);
    setActivePos(null);
  };

  /** Positions an absolutely-placed popover near a viewport rect, relative to
   *  the scrollable container's content (scrollTop compensates for scrolling). */
  const positionFromRect = (rect: DOMRect): { top: number; left: number } => {
    const container = containerRef.current;
    if (!container) return { top: 0, left: 0 };
    const containerRect = container.getBoundingClientRect();
    return {
      top: rect.bottom - containerRect.top + container.scrollTop + 6,
      left: Math.max(
        8,
        Math.min(rect.left - containerRect.left, Math.max(8, container.clientWidth - 272))
      ),
    };
  };

  const refreshAnnotations = async () => {
    setAnnotations(await getSubmissionAnnotations(submissionId));
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as Node;
    if (
      createPopoverRef.current?.contains(target) ||
      viewPopoverRef.current?.contains(target)
    ) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      hideCreatePopover();
      return;
    }
    const range = selection.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      hideCreatePopover();
      return;
    }

    // Character offsets relative to the body text: measure the text between
    // the container's start and the selection's start (and between the
    // selection's end and the container's end) via cloned ranges. The block
    // is dir="ltr", so document order equals logical offset order.
    const before = document.createRange();
    before.selectNodeContents(container);
    const after = document.createRange();
    after.selectNodeContents(container);
    try {
      before.setEnd(range.startContainer, range.startOffset);
      after.setStart(range.endContainer, range.endOffset);
    } catch {
      hideCreatePopover();
      return;
    }
    const start = before.toString().length;
    const end = body.length - after.toString().length;
    if (end <= start) {
      hideCreatePopover();
      return;
    }

    hideViewPopover();
    setPending({ start, end, ...positionFromRect(range.getBoundingClientRect()) });
    setComment("");
  };

  const handleSaveAnnotation = () => {
    if (!pending || isSaving) return;
    const trimmed = comment.trim();
    if (trimmed === "") return;

    const fd = new FormData();
    fd.set("submissionId", submissionId);
    fd.set("startOffset", String(pending.start));
    fd.set("endOffset", String(pending.end));
    fd.set("comment", trimmed);

    setIsSaving(true);
    void (async () => {
      const result = await saveSubmissionAnnotation(fd);
      setIsSaving(false);
      if (result.success) {
        window.getSelection()?.removeAllRanges();
        hideCreatePopover();
        toast({ title: t.annotationSaved });
        await refreshAnnotations();
      } else {
        toast({
          variant: "destructive",
          title: t.actionFailed,
          description: t.failures[result.message] ?? result.message,
        });
      }
    })();
  };

  const handleDeleteAnnotation = (id: string) => {
    if (isDeleting) return;
    const fd = new FormData();
    fd.set("id", id);

    setIsDeleting(true);
    void (async () => {
      const result = await deleteSubmissionAnnotation(fd);
      setIsDeleting(false);
      if (result.success) {
        hideViewPopover();
        toast({ title: t.annotationDeleted });
        await refreshAnnotations();
      } else {
        toast({
          variant: "destructive",
          title: t.actionFailed,
          description: t.failures[result.message] ?? result.message,
        });
      }
    })();
  };

  const handleMarkClick = (
    event: React.MouseEvent<HTMLElement>,
    annotation: AdminSubmissionAnnotation
  ) => {
    event.stopPropagation();
    window.getSelection()?.removeAllRanges();
    hideCreatePopover();
    setActiveId(annotation.id);
    setActivePos(positionFromRect(event.currentTarget.getBoundingClientRect()));
  };

  return (
    <div className="space-y-1">
      <div
        ref={containerRef}
        dir="ltr"
        onMouseUp={handleMouseUp}
        className="relative max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm"
      >
        {segments.map((segment, index) => {
          const annotation = segment.annotation;
          if (!annotation) return <span key={index}>{segment.text}</span>;
          return (
            <mark
              key={`${index}-${annotation.id}`}
              title={annotation.comment}
              onClick={(e) => handleMarkClick(e, annotation)}
              className="cursor-pointer bg-amber-200/60 underline decoration-dotted dark:bg-amber-500/30"
            >
              {segment.text}
            </mark>
          );
        })}

        {pending && (
          <div
            ref={createPopoverRef}
            dir="auto"
            style={{ top: pending.top, left: pending.left }}
            className="absolute z-20 flex w-64 items-center gap-1 rounded-lg border bg-popover p-2 shadow-md"
          >
            <Input
              ref={commentInputRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.commentPlaceholder}
              className="h-8 text-xs"
              disabled={isSaving}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveAnnotation();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSaveAnnotation}
              disabled={isSaving || comment.trim() === ""}
              aria-label={t.saveAnnotation}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {activeAnnotation && activePos && (
          <div
            ref={viewPopoverRef}
            dir="auto"
            style={{ top: activePos.top, left: activePos.left }}
            className="absolute z-20 w-64 space-y-2 rounded-lg border bg-popover p-2 text-sm shadow-md"
          >
            <p className="whitespace-pre-wrap break-words">{activeAnnotation.comment}</p>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteAnnotation(activeAnnotation.id)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="me-1 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="me-1 h-4 w-4" />
                )}
                {t.deleteAnnotation}
              </Button>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t.annotateHint}</p>
    </div>
  );
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

  // 48h SLA — computed after mount so server/client render agree.
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    if (item.status !== "pending") {
      setOverdue(false);
      return;
    }
    const submitted = new Date(item.submittedAt).getTime();
    setOverdue(!Number.isNaN(submitted) && Date.now() - submitted > SLA_MS);
  }, [item.status, item.submittedAt]);

  const appendSnippet = (snippet: string) => {
    setFeedback((prev) => {
      if (prev === "") return snippet;
      const separator = /\s$/.test(prev) ? "" : " ";
      return prev + separator + snippet;
    });
  };

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
          {item.status === "pending" &&
            (overdue ? (
              <Badge variant="destructive">{t.slaOverdue}</Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-300"
              >
                {t.slaTarget}
              </Badge>
            ))}
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
              <AnnotatedText submissionId={item.id} body={item.body} />
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
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t.snippetLabel}:
                  </span>
                  {SNIPPETS.map((snippet) => (
                    <Button
                      key={snippet.insert}
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      title={snippet.insert.trim()}
                      onClick={() => appendSnippet(snippet.insert)}
                    >
                      {snippet.label[language]}
                    </Button>
                  ))}
                </div>
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
