"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Language, LocalizedString } from "@/lib/types";
import { useLanguage } from "@/context/language-context";
import { EmptyState } from "@/components/admin/empty-state";
import {
  deleteGrammarTopic,
  upsertGrammarTopic,
  type ActionResult,
} from "@/app/actions/grammar-admin-actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// --- Trilingual UI strings (Persian-first, German in Sie-form) ---

const ui = {
  en: {
    browserTitle: "Grammar Bank",
    browserSubtitle: "Author the public grammar topics and link them to LMS lessons.",
    newTopic: "New topic",
    manage: "Manage",
    empty: "No grammar topics yet",
    emptySub: "Create the first grammar topic for the public site.",
    emptyCta: "Create the first topic",
    heading: "Grammar topic",
    headingNew: "New grammar topic",
    subtitle: "Edit the topic and pick which LMS lessons link to it.",
    subtitleNew: "Fill in the fields and save. The slug becomes /grammar/<slug>.",
    save: "Save",
    delete: "Delete",
    unsaved: "unsaved",
    savedToast: "Saved.",
    deletedToast: "deleted.",
    actionFailed: "Action failed",
    failures: {
      unauthorized: "Your session is not authorized for this change.",
      invalid_input:
        "Check the fields: Persian text is required and the slug must be 2–80 lowercase letters, digits or dashes.",
      invalid_examples:
        "The examples field must be a JSON array of {de, en, fa} objects (max 12) — or empty.",
      slug_taken: "That slug is already used by another grammar topic.",
      save_failed: "The server could not save this topic (check that the linked lessons still exist).",
      delete_failed: "The server could not delete this item.",
    } as Record<string, string>,
    newTopicFallback: "New grammar topic",
    nounTopic: "Topic",
    confirmDelete: "Delete this grammar topic and its lesson links?",
    slugLabel: "Slug",
    slugHint: "2–80 chars: a-z, 0-9, dashes.",
    levelLabel: "Level",
    sortOrder: "Sort order",
    title: "Title",
    explanation: "Explanation",
    examplesLabel: "Examples (JSON array of {de, en, fa}, max 12)",
    examplesStatus: {
      empty: "Empty → saved as no examples.",
      valid: "Valid JSON array of {de, en, fa} objects.",
      invalid: "Not a valid JSON array of {de, en, fa} objects.",
    } as Record<ExamplesStatus, string>,
    lessonsLabel: "Linked lessons",
    lessonsSelected: "selected",
    lessonsHint: "Saving replaces this topic's links with exactly the checked lessons.",
    noLessons: "No LMS lessons exist yet.",
  },
  de: {
    browserTitle: "Grammatik",
    browserSubtitle:
      "Erstellen Sie die öffentlichen Grammatikthemen und verknüpfen Sie sie mit LMS-Lektionen.",
    newTopic: "Neues Thema",
    manage: "Verwalten",
    empty: "Noch keine Grammatikthemen",
    emptySub: "Erstellen Sie das erste Grammatikthema für die öffentliche Seite.",
    emptyCta: "Erstes Thema anlegen",
    heading: "Grammatikthema",
    headingNew: "Neues Grammatikthema",
    subtitle: "Bearbeiten Sie das Thema und wählen Sie, welche LMS-Lektionen damit verknüpft werden.",
    subtitleNew: "Füllen Sie die Felder aus und speichern Sie. Der Slug wird zu /grammar/<slug>.",
    save: "Speichern",
    delete: "Löschen",
    unsaved: "ungespeichert",
    savedToast: "Gespeichert.",
    deletedToast: "gelöscht.",
    actionFailed: "Aktion fehlgeschlagen",
    failures: {
      unauthorized: "Ihre Sitzung ist für diese Änderung nicht berechtigt.",
      invalid_input:
        "Bitte prüfen Sie die Felder: Persischer Text ist erforderlich und der Slug muss aus 2–80 Kleinbuchstaben, Ziffern oder Bindestrichen bestehen.",
      invalid_examples:
        "Das Beispiele-Feld muss ein JSON-Array aus {de, en, fa}-Objekten (max. 12) sein — oder leer.",
      slug_taken: "Dieser Slug wird bereits von einem anderen Grammatikthema verwendet.",
      save_failed:
        "Der Server konnte dieses Thema nicht speichern (prüfen Sie, ob die verknüpften Lektionen noch existieren).",
      delete_failed: "Der Server konnte dieses Element nicht löschen.",
    } as Record<string, string>,
    newTopicFallback: "Neues Grammatikthema",
    nounTopic: "Thema",
    confirmDelete: "Dieses Grammatikthema und seine Lektionsverknüpfungen löschen?",
    slugLabel: "Slug",
    slugHint: "2–80 Zeichen: a-z, 0-9, Bindestriche.",
    levelLabel: "Niveau",
    sortOrder: "Reihenfolge",
    title: "Titel",
    explanation: "Erklärung",
    examplesLabel: "Beispiele (JSON-Array aus {de, en, fa}, max. 12)",
    examplesStatus: {
      empty: "Leer → wird ohne Beispiele gespeichert.",
      valid: "Gültiges JSON-Array aus {de, en, fa}-Objekten.",
      invalid: "Kein gültiges JSON-Array aus {de, en, fa}-Objekten.",
    } as Record<ExamplesStatus, string>,
    lessonsLabel: "Verknüpfte Lektionen",
    lessonsSelected: "ausgewählt",
    lessonsHint:
      "Beim Speichern werden die Verknüpfungen dieses Themas genau durch die markierten Lektionen ersetzt.",
    noLessons: "Es gibt noch keine LMS-Lektionen.",
  },
  fa: {
    browserTitle: "بانک گرامر",
    browserSubtitle: "نوشتن موضوع‌های عمومی گرامر و اتصال آنها به درس‌های LMS.",
    newTopic: "موضوع جدید",
    manage: "مدیریت",
    empty: "هنوز موضوع گرامری ساخته نشده است",
    emptySub: "اولین موضوع گرامری را برای سایت عمومی بسازید.",
    emptyCta: "ایجاد اولین موضوع",
    heading: "موضوع گرامری",
    headingNew: "موضوع گرامری جدید",
    subtitle: "موضوع را ویرایش کنید و تعیین کنید کدام درس‌های LMS به آن وصل شوند.",
    subtitleNew: "فیلدها را پر کنید و ذخیره کنید. نامک، نشانی /grammar/<slug> می‌شود.",
    save: "ذخیره",
    delete: "حذف",
    unsaved: "ذخیره‌نشده",
    savedToast: "ذخیره شد.",
    deletedToast: "حذف شد.",
    actionFailed: "انجام عملیات ناموفق بود",
    failures: {
      unauthorized: "اجازهٔ انجام این تغییر را ندارید.",
      invalid_input:
        "فیلدها را بررسی کنید: متن فارسی الزامی است و نامک باید ۲ تا ۸۰ نویسه از حروف کوچک a-z، رقم یا خط تیره باشد.",
      invalid_examples:
        "فیلد مثال‌ها باید آرایهٔ JSON از اشیای {de, en, fa} (حداکثر ۱۲) باشد — یا خالی.",
      slug_taken: "این نامک قبلاً برای موضوع دیگری ثبت شده است.",
      save_failed: "سرور نتوانست این موضوع را ذخیره کند (وجود درس‌های متصل را بررسی کنید).",
      delete_failed: "سرور نتوانست این مورد را حذف کند.",
    } as Record<string, string>,
    newTopicFallback: "موضوع گرامری جدید",
    nounTopic: "موضوع",
    confirmDelete: "این موضوع گرامری همراه با اتصال‌های درس‌هایش حذف شود؟",
    slugLabel: "نامک (slug)",
    slugHint: "۲ تا ۸۰ نویسه: a-z، ۰-۹ و خط تیره.",
    levelLabel: "سطح",
    sortOrder: "ترتیب",
    title: "عنوان",
    explanation: "توضیح",
    examplesLabel: "مثال‌ها (آرایهٔ JSON با {de, en, fa}، حداکثر ۱۲)",
    examplesStatus: {
      empty: "خالی ← بدون مثال ذخیره می‌شود.",
      valid: "آرایهٔ JSON معتبر از اشیای {de, en, fa}.",
      invalid: "آرایهٔ JSON از اشیای {de, en, fa} معتبر نیست.",
    } as Record<ExamplesStatus, string>,
    lessonsLabel: "درس‌های مرتبط",
    lessonsSelected: "انتخاب‌شده",
    lessonsHint: "با ذخیره کردن، اتصال‌های این موضوع دقیقاً با درس‌های تیک‌خورده جایگزین می‌شوند.",
    noLessons: "هنوز درسی در LMS وجود ندارد.",
  },
} as const;

type UiContent = (typeof ui)[keyof typeof ui];

function reportResult(
  toast: ReturnType<typeof useToast>["toast"],
  result: ActionResult,
  t: UiContent,
  deletedNoun?: string
): void {
  if (result.success) {
    toast({
      title:
        result.message === "deleted"
          ? `${deletedNoun ?? ""} ${t.deletedToast}`.trim()
          : t.savedToast,
    });
    return;
  }
  toast({
    variant: "destructive",
    title: t.actionFailed,
    description: t.failures[result.message] ?? result.message,
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
  const { language } = useLanguage();
  const t = ui[language];
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
        reportResult(toast, result, t);
        if (result.success) {
          if (result.id && !topic.id) patchTopic({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!topic.id || !window.confirm(t.confirmDelete)) return;
    const fd = new FormData();
    fd.set("id", topic.id);

    startTransition(() => {
      void (async () => {
        const result = await deleteGrammarTopic(fd);
        reportResult(toast, result, t, t.nounTopic);
        if (result.success) router.push("/admin/grammar");
      })();
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {topic.id ? `${t.heading} · /grammar/${topic.slug}` : t.headingNew}
        </h1>
        <p className="text-muted-foreground">{topic.id ? t.subtitle : t.subtitleNew}</p>
      </div>

      <Card className="border-2">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            {topic.title.fa || topic.title.en || t.newTopicFallback}
            {!topic.id && (
              <span className="align-middle text-xs font-normal text-muted-foreground">{t.unsaved}</span>
            )}
            <Badge variant="outline">{topic.level.toUpperCase()}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
              {t.save}
            </Button>
            {topic.id ? (
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
                <Trash2 className="me-1 h-4 w-4" />
                {t.delete}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[260px_180px_140px] sm:items-end">
            <div className="space-y-1">
              <Label htmlFor={`topic-${topic.key}-slug`}>{t.slugLabel}</Label>
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
              <p className="text-xs text-muted-foreground">{t.slugHint}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`topic-${topic.key}-level`}>{t.levelLabel}</Label>
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
              label={t.sortOrder}
              value={topic.sortOrder}
              onChange={(sortOrder) => patchTopic({ sortOrder })}
              min={0}
            />
          </div>

          <LangInputs
            idPrefix={`topic-${topic.key}-title`}
            label={t.title}
            value={topic.title}
            onChange={(title) => patchTopic({ title })}
          />
          <LangTextareas
            idPrefix={`topic-${topic.key}-explanation`}
            label={t.explanation}
            value={topic.explanation}
            onChange={(explanation) => patchTopic({ explanation })}
            rows={6}
          />

          <div className="space-y-1">
            <Label htmlFor={`topic-${topic.key}-examples`}>{t.examplesLabel}</Label>
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
              {t.examplesStatus[examplesStatus]}
            </p>
          </div>

          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <div className="text-sm font-medium">
              {t.lessonsLabel} ({linked.size} {t.lessonsSelected})
            </div>
            <p className="text-xs text-muted-foreground">{t.lessonsHint}</p>
            {lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noLessons}</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
    </div>
  );
}

// --- Grammar list page body (heading + new-topic button + grid) ---

export interface GrammarTopicListItem {
  id: string;
  slug: string;
  title: LocalizedString;
  level: string;
}

export function GrammarTopicsBrowser({ topics }: { topics: GrammarTopicListItem[] }) {
  const { language } = useLanguage();
  const t = ui[language];

  const titleFor = (topic: GrammarTopicListItem) =>
    topic.title[language] || topic.title.fa || topic.title.en;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.browserTitle}</h1>
          <p className="text-muted-foreground">{t.browserSubtitle}</p>
        </div>
        <Button asChild>
          <Link href="/admin/grammar/new">
            <Plus className="me-1 h-4 w-4" />
            {t.newTopic}
          </Link>
        </Button>
      </div>

      {topics.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          en={ui.en.empty}
          de={ui.de.empty}
          fa={ui.fa.empty}
          subEn={ui.en.emptySub}
          subDe={ui.de.emptySub}
          subFa={ui.fa.emptySub}
          action={{
            href: "/admin/grammar/new",
            labelEn: ui.en.emptyCta,
            labelDe: ui.de.emptyCta,
            labelFa: ui.fa.emptyCta,
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {topics.map((topic) => (
            <Card key={topic.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{titleFor(topic)}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="outline">/grammar/{topic.slug}</Badge>
                  <Badge variant="secondary">{topic.level.toUpperCase()}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex justify-end">
                <Button asChild size="sm">
                  <Link href={`/admin/grammar/${topic.id}`}>
                    {t.manage}
                    <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
