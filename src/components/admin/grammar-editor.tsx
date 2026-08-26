"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import type { Language, LocalizedString } from "@/lib/types";
import {
  deleteGrammarTopic,
  upsertGrammarTopic,
  type ActionResult,
} from "@/app/actions/grammar-admin-actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

// --- Editor-side types (mapped from DB rows by the server page) ---

export type GrammarLevel = "a1" | "a2" | "b1" | "b2" | "c1" | "c2";

export interface GrammarExample {
  de: string;
  en: string;
  fa: string;
}

export interface TopicNode {
  key: string;
  id: string | null;
  slug: string;
  title: LocalizedString;
  level: GrammarLevel;
  explanation: LocalizedString;
  /** Raw JSON-array text edited in the monospace textarea. */
  examplesJson: string;
  sortOrder: string;
}

export interface LessonOption {
  id: string;
  title: LocalizedString;
}

// --- Constants ---

const LANGS: Language[] = ["en", "de", "fa"];
const LANG_LABEL: Record<Language, string> = { en: "EN", de: "DE", fa: "FA" };
const LEVELS: GrammarLevel[] = ["a1", "a2", "b1", "b2", "c1", "c2"];

function emptyLocalized(): LocalizedString {
  return { en: "", de: "", fa: "" };
}

/** Blank topic used by the /admin/grammar/new route. */
export function blankTopicNode(): TopicNode {
  return {
    key: "new",
    id: null,
    slug: "",
    title: emptyLocalized(),
    level: "a1",
    explanation: emptyLocalized(),
    examplesJson: "[]",
    sortOrder: "0",
  };
}

// --- Result toast mapping ---

const FAILURE_DESCRIPTIONS: Record<string, string> = {
  unauthorized: "Your session is not authorized for this change.",
  invalid_input:
    "Check the fields: Persian text is required and the slug must be 2–80 lowercase letters, digits or dashes.",
  invalid_examples:
    "The examples field must be a JSON array of {de, en, fa} objects (max 12) — or empty.",
  slug_taken: "That slug is already used by another grammar topic.",
  save_failed: "The server could not save this topic (check that the linked lessons still exist).",
  delete_failed: "The server could not delete this item.",
};

function reportResult(
  toast: ReturnType<typeof useToast>["toast"],
  result: ActionResult,
  deletedNoun?: string
): void {
  if (result.success) {
    toast({ title: result.message === "deleted" ? `${deletedNoun ?? "Item"} deleted.` : "Saved." });
    return;
  }
  toast({
    variant: "destructive",
    title: "Action failed",
    description: FAILURE_DESCRIPTIONS[result.message] ?? result.message,
  });
}

// --- Small field atoms (copied verbatim-style from exam-editor) ---

interface LangFieldsProps {
  idPrefix: string;
  label: string;
  value: LocalizedString;
  onChange: (next: LocalizedString) => void;
}

function LangInputs({ idPrefix, label, value, onChange }: LangFieldsProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {LANGS.map((lang) => (
          <div key={lang} className="space-y-1">
            <Label htmlFor={`${idPrefix}-${lang}`} className="text-xs text-muted-foreground">
              {LANG_LABEL[lang]}
            </Label>
            <Input
              id={`${idPrefix}-${lang}`}
              dir={lang === "fa" ? "rtl" : "ltr"}
              value={value[lang]}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function LangTextareas({ idPrefix, label, value, onChange, rows }: LangFieldsProps & { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {LANGS.map((lang) => (
          <div key={lang} className="space-y-1">
            <Label htmlFor={`${idPrefix}-${lang}`} className="text-xs text-muted-foreground">
              {LANG_LABEL[lang]}
            </Label>
            <Textarea
              id={`${idPrefix}-${lang}`}
              dir={lang === "fa" ? "rtl" : "ltr"}
              rows={rows ?? 4}
              value={value[lang]}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  min?: number;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28"
      />
    </div>
  );
}

type ExamplesStatus = "empty" | "valid" | "invalid";

function checkExamplesJson(raw: string): ExamplesStatus {
  if (raw.trim() === "") return "empty";
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return "invalid";
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) return "invalid";
      const record = entry as Record<string, unknown>;
      if (
        typeof record.de !== "string" ||
        typeof record.en !== "string" ||
        typeof record.fa !== "string"
      ) {
        return "invalid";
      }
    }
    return "valid";
  } catch {
    return "invalid";
  }
}

const EXAMPLES_STATUS_TEXT: Record<ExamplesStatus, string> = {
  empty: "Empty → saved as no examples.",
  valid: "Valid JSON array of {de, en, fa} objects.",
  invalid: "Not a valid JSON array of {de, en, fa} objects.",
};

// --- Root editor ---

export function GrammarEditor({
  topic: initialTopic,
  lessons,
  linkedLessonIds,
}: {
  topic: TopicNode;
  lessons: LessonOption[];
  linkedLessonIds: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [topic, setTopic] = useState<TopicNode>(initialTopic);
  const [linked, setLinked] = useState<Set<string>>(new Set(linkedLessonIds));
  const [isPending, startTransition] = useTransition();

  const patchTopic = useCallback((patch: Partial<TopicNode>) => {
    setTopic((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleLesson = useCallback((lessonId: string, checked: boolean) => {
    setLinked((prev) => {
      const next = new Set(prev);
      if (checked) next.add(lessonId);
      else next.delete(lessonId);
      return next;
    });
  }, []);

  const examplesStatus = useMemo(() => checkExamplesJson(topic.examplesJson), [topic.examplesJson]);

  const handleSave = () => {
    const fd = new FormData();
    if (topic.id) fd.set("id", topic.id);
    fd.set("slug", topic.slug.trim());
    fd.set("titleEn", topic.title.en);
    fd.set("titleDe", topic.title.de);
    fd.set("titleFa", topic.title.fa);
    fd.set("level", topic.level);
    fd.set("explanationEn", topic.explanation.en);
    fd.set("explanationDe", topic.explanation.de);
    fd.set("explanationFa", topic.explanation.fa);
    fd.set("examplesJson", topic.examplesJson);
    fd.set("sortOrder", topic.sortOrder.trim() === "" ? "0" : topic.sortOrder);
    for (const lessonId of linked) fd.append("lessonIds", lessonId);

    startTransition(() => {
      void (async () => {
        const result = await upsertGrammarTopic(fd);
        reportResult(toast, result);
        if (result.success) {
          if (result.id && !topic.id) patchTopic({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!topic.id || !window.confirm("Delete this grammar topic and its lesson links?")) return;
    const fd = new FormData();
    fd.set("id", topic.id);

    startTransition(() => {
      void (async () => {
        const result = await deleteGrammarTopic(fd);
        reportResult(toast, result, "Topic");
        if (result.success) router.push("/admin/grammar");
      })();
    });
  };

  return (
    <Card className="border-2">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          {topic.title.fa || topic.title.en || "New grammar topic"}
          {!topic.id && (
            <span className="align-middle text-xs font-normal text-muted-foreground">unsaved</span>
          )}
          <Badge variant="outline">{topic.level.toUpperCase()}</Badge>
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            Save
          </Button>
          {topic.id ? (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="me-1 h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[260px_180px_140px] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor={`topic-${topic.key}-slug`}>Slug</Label>
            <div className="flex items-center gap-0 rounded-md border border-input focus-within:ring-1 focus-within:ring-ring">
              <span
                aria-hidden="true"
                className="select-none border-e px-2 py-2 text-xs text-muted-foreground"
              >
                /grammar/
              </span>
              <Input
                id={`topic-${topic.key}-slug`}
                className="rounded-s-none border-0 focus-visible:ring-0"
                placeholder="perfekt-tense"
                value={topic.slug}
                onChange={(e) => patchTopic({ slug: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">2–80 chars: a-z, 0-9, dashes.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`topic-${topic.key}-level`}>Level</Label>
            <Select
              value={topic.level}
              onValueChange={(level) => patchTopic({ level: level as GrammarLevel })}
            >
              <SelectTrigger id={`topic-${topic.key}-level`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumberField
            id={`topic-${topic.key}-sort`}
            label="Sort order"
            value={topic.sortOrder}
            onChange={(sortOrder) => patchTopic({ sortOrder })}
            min={0}
          />
        </div>

        <LangInputs
          idPrefix={`topic-${topic.key}-title`}
          label="Title"
          value={topic.title}
          onChange={(title) => patchTopic({ title })}
        />
        <LangTextareas
          idPrefix={`topic-${topic.key}-explanation`}
          label="Explanation"
          value={topic.explanation}
          onChange={(explanation) => patchTopic({ explanation })}
          rows={6}
        />

        <div className="space-y-1">
          <Label htmlFor={`topic-${topic.key}-examples`}>
            Examples (JSON array of {"{de, en, fa}"}, max 12)
          </Label>
          <Textarea
            id={`topic-${topic.key}-examples`}
            rows={6}
            spellCheck={false}
            className={`font-mono text-xs ${
              examplesStatus === "valid"
                ? "border-emerald-500 focus-visible:ring-emerald-500"
                : examplesStatus === "invalid"
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
            }`}
            placeholder={'[\n  { "de": "Ich habe gelernt.", "en": "I have studied.", "fa": "من درس خوانده‌ام." }\n]'}
            value={topic.examplesJson}
            onChange={(e) => patchTopic({ examplesJson: e.target.value })}
          />
          <p
            className={`text-xs ${
              examplesStatus === "invalid" ? "text-red-600" : "text-muted-foreground"
            }`}
          >
            {EXAMPLES_STATUS_TEXT[examplesStatus]}
          </p>
        </div>

        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <div className="text-sm font-medium">Lesson links ({linked.size} selected)</div>
          <p className="text-xs text-muted-foreground">
            Saving replaces this topic&apos;s links with exactly the checked lessons.
          </p>
          {lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No LMS lessons exist yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => {
                const checkboxId = `topic-${topic.key}-lesson-${lesson.id}`;
                return (
                  <div key={lesson.id} className="flex items-start gap-2 rounded-md border p-2">
                    <Checkbox
                      id={checkboxId}
                      checked={linked.has(lesson.id)}
                      onCheckedChange={(checked) => toggleLesson(lesson.id, checked === true)}
                    />
                    <Label
                      htmlFor={checkboxId}
                      className="line-clamp-2 cursor-pointer text-xs font-normal leading-snug"
                    >
                      {lesson.title.fa || lesson.title.en || lesson.title.de || lesson.id}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
