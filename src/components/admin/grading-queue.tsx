"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2, PlayCircle } from "lucide-react";
import {
  gradeSubmission,
  getSubmissionAudioUrl,
} from "@/app/actions/submissions-actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const RUBRIC_FIELDS: Array<{ key: RubricKey; label: string; hint: string }> = [
  { key: "wirkung", label: "Impact on reader (Wirkung)", hint: "1 weak … 5 excellent" },
  {
    key: "aufgabe",
    label: "Task fulfilment (Aufgabenstellung)",
    hint: "1 weak … 5 excellent",
  },
  {
    key: "sprache",
    label: "Language use (Sprachliche Mittel)",
    hint: "1 weak … 5 excellent",
  },
];

// --- Result toast mapping (message keys are contractual with the action) ---

const FAILURE_DESCRIPTIONS: Record<string, string> = {
  invalid_input: "All three rubric scores and feedback text are required.",
  not_found: "This submission no longer exists.",
  unauthorized: "Your session is not authorized to grade.",
  already_graded: "This submission was already graded.",
};

function formatSubmittedAt(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("de-DE");
}

// --- Root queue ---

export function GradingQueue({ items }: { items: AdminSubmissionItem[] }) {
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

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Nothing to grade right now.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          Pending {pendingCount}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          Graded {gradedCount}
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
          toast({ title: "Submission graded." });
          router.refresh(); // list re-renders from the server, pending-first
        } else {
          toast({
            variant: "destructive",
            title: "Action failed",
            description: FAILURE_DESCRIPTIONS[result.message] ?? result.message,
          });
        }
      })();
    });
  };

  const taskMeta = [
    ...(item.task.timeLimitMin != null ? [`${item.task.timeLimitMin} min`] : []),
    ...(item.task.wordMin != null || item.task.wordMax != null
      ? [`${item.task.wordMin ?? "?"}–${item.task.wordMax ?? "?"} words`]
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
              {formatSubmittedAt(item.submittedAt)}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className="hover:bg-accent">
            {item.task.skill === "schreiben" ? "Schreiben" : "Sprechen"}
          </Badge>
          {item.status === "pending" ? (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60">
              Pending
            </Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60">
              Graded
            </Badge>
          )}
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 border-t pt-4">
          {/* Task prompt — trilingual stacked muted blocks */}
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-sm font-medium">Task prompt</div>
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
              <p className="text-sm text-muted-foreground">No text was submitted.</p>
            )
          ) : audioUrl ? (
            <audio controls src={audioUrl} className="w-full" />
          ) : isLoadingAudio ? (
            <Button variant="outline" disabled>
              <Loader2 className="me-1 h-4 w-4 animate-spin" />
              Loading…
            </Button>
          ) : audioFailed ? (
            <p className="text-sm text-destructive">Recording could not be loaded.</p>
          ) : (
            <Button variant="outline" onClick={handleLoadRecording}>
              <PlayCircle className="me-1 h-4 w-4" />
              Load recording
            </Button>
          )}

          {/* Graded → read-only rubric + feedback */}
          {item.status === "graded" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {RUBRIC_FIELDS.map(({ key, label }) => (
                  <div key={key} className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-muted-foreground">{label}</div>
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
                {RUBRIC_FIELDS.map(({ key, label, hint }) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`${item.id}-${key}`}>{label}</Label>
                    <Select
                      value={scores[key]}
                      onValueChange={(value) =>
                        setScores((prev) => ({ ...prev, [key]: value }))
                      }
                    >
                      <SelectTrigger id={`${item.id}-${key}`}>
                        <SelectValue placeholder="Score" />
                      </SelectTrigger>
                      <SelectContent>
                        {RUBRIC_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <Label htmlFor={`${item.id}-feedback`}>Feedback</Label>
                <Textarea
                  id={`${item.id}-feedback`}
                  rows={6}
                  minLength={1}
                  placeholder="Specific, encouraging feedback with corrections…"
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
                  Grade submission
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
