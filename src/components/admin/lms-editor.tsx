"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FolderOpen, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Language, LocalizedString } from "@/lib/types";
import { SKILL_LABELS } from "@/lib/label-utils";
import { useLanguage } from "@/context/language-context";
import {
  deleteLmsLesson,
  deleteLmsModule,
  deleteLmsQuestion,
  upsertLmsLesson,
  upsertLmsModule,
  upsertLmsQuestion,
  type ActionResult,
} from "@/app/actions/lms-admin-actions";

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
import { EmptyState } from "@/components/admin/empty-state";

// --- Editor-side tree types (mapped from DB rows by the server page) ---

export type LmsSkill = "lesen" | "hoeren" | "schreiben" | "sprechen" | "allgemein";
export type EditorQuestionType = "mc" | "jnl" | "match";
export type JnlValue = "ja" | "nein" | "nichts";

export interface McState {
  kind: "mc";
  optionCount: number;
  /** Fixed length 6, indexed by option letter a..f. */
  texts: LocalizedString[];
  correct: string;
}
export interface JnlState {
  kind: "jnl";
  correct: JnlValue;
}
export interface MatchState {
  kind: "match";
  pairCount: number;
  /** Fixed length 6, indexed by pair number - 1. */
  left: LocalizedString[];
  right: LocalizedString[];
}
export type QuestionData = McState | JnlState | MatchState;

export interface EditorQuestion {
  key: string;
  id: string | null;
  lessonId: string | null;
  type: EditorQuestionType;
  prompt: LocalizedString;
  points: string;
  sortOrder: string;
  data: QuestionData;
}

export interface EditorLesson {
  key: string;
  id: string | null;
  moduleId: string | null;
  title: LocalizedString;
  body: LocalizedString;
  videoUrl: string;
  skill: LmsSkill;
  durationMin: string;
  isFreePreview: boolean;
  sortOrder: string;
  questions: EditorQuestion[];
}

export interface EditorModule {
  key: string;
  id: string | null;
  title: LocalizedString;
  sortOrder: string;
  lessons: EditorLesson[];
}

// --- Constants ---

const LANGS: Language[] = ["en", "de", "fa"];
const LANG_LABEL: Record<Language, string> = { en: "EN", de: "DE", fa: "FA" };
const LETTERS = ["a", "b", "c", "d", "e", "f"] as const;
const INDICES = [0, 1, 2, 3, 4, 5] as const;
const SKILLS: LmsSkill[] = ["lesen", "hoeren", "schreiben", "sprechen", "allgemein"];
const QUESTION_TYPES: EditorQuestionType[] = ["mc", "jnl", "match"];
const JNL_VALUES: JnlValue[] = ["ja", "nein", "nichts"];

function emptyLocalized(): LocalizedString {
  return { en: "", de: "", fa: "" };
}

function localizedArray(): LocalizedString[] {
  return INDICES.map(() => emptyLocalized());
}

// --- Trilingual UI strings (Persian-first, German in Sie-form) ---

const ui = {
  en: {
    headingPrefix: "Curriculum",
    subtitle:
      "Modules, lessons and questions for this class. Save parent items before adding children.",
    save: "Save",
    delete: "Delete",
    remove: "Remove",
    unsaved: "unsaved",
    savedToast: "Saved.",
    deletedToast: "deleted.",
    actionFailed: "Action failed",
    failures: {
      unauthorized: "Your session is not authorized for this change.",
      invalid_input:
        "Check the fields: Persian text is required, URLs must be valid, match pairs must be complete.",
      delete_failed: "The server could not delete this item.",
    } as Record<string, string>,
    newModule: "New module",
    nounModule: "Module",
    confirmDeleteModule: "Delete this module with all its lessons and questions?",
    title: "Title",
    sortOrder: "Sort order",
    lessonsLabel: "Lessons",
    addLesson: "Add lesson",
    saveModuleFirst: "Save the module first",
    noLessons: "No lessons yet.",
    newLesson: "New lesson",
    nounLesson: "Lesson",
    confirmDeleteLesson: "Delete this lesson with all its questions?",
    body: "Body",
    videoUrl: "Video URL (optional)",
    skill: "Skill",
    durationMin: "Duration (min)",
    freePreview: "free preview",
    freePreviewLabel: "Free preview",
    questionsLabel: "Questions",
    addQuestion: "Add question",
    saveLessonFirst: "Save the lesson first",
    noQuestions: "No questions yet.",
    newQuestion: "New question",
    nounQuestion: "Question",
    confirmDeleteQuestion: "Delete this question?",
    type: "Type",
    points: "Points",
    pointsShort: "pt",
    prompt: "Prompt / statement",
    typeMc: "Multiple choice",
    typeJnl: "Ja / Nein / Nichts",
    typeMatch: "Matching pairs",
    options: "Options",
    optionsHint:
      "Empty options are dropped on save. Mark the correct one with the radio button.",
    correctAria: (letter: string) => `Correct answer ${letter}`,
    correctAnswer: "Correct answer",
    pairs: "Pairs",
    pairsHint:
      "Left items map to their same-numbered right item (1→1, 2→2, …). All pairs must be complete.",
    leftN: (n: number) => `Left ${n}`,
    rightN: (n: number) => `Right ${n}`,
    noModules: "No modules yet for this class. Add the first one below.",
    addModule: "Add module",
  },
  de: {
    headingPrefix: "Lehrplan",
    subtitle:
      "Module, Lektionen und Fragen für diesen Kurs. Speichern Sie übergeordnete Elemente, bevor Sie untergeordnete hinzufügen.",
    save: "Speichern",
    delete: "Löschen",
    remove: "Entfernen",
    unsaved: "ungespeichert",
    savedToast: "Gespeichert.",
    deletedToast: "gelöscht.",
    actionFailed: "Aktion fehlgeschlagen",
    failures: {
      unauthorized: "Ihre Sitzung ist für diese Änderung nicht berechtigt.",
      invalid_input:
        "Bitte prüfen Sie die Felder: Persischer Text ist erforderlich, URLs müssen gültig sein, Zuordnungspaare müssen vollständig sein.",
      delete_failed: "Der Server konnte dieses Element nicht löschen.",
    } as Record<string, string>,
    newModule: "Neues Modul",
    nounModule: "Modul",
    confirmDeleteModule: "Dieses Modul samt aller Lektionen und Fragen löschen?",
    title: "Titel",
    sortOrder: "Reihenfolge",
    lessonsLabel: "Lektionen",
    addLesson: "Lektion hinzufügen",
    saveModuleFirst: "Speichern Sie zuerst das Modul",
    noLessons: "Noch keine Lektionen.",
    newLesson: "Neue Lektion",
    nounLesson: "Lektion",
    confirmDeleteLesson: "Diese Lektion samt aller Fragen löschen?",
    body: "Inhalt",
    videoUrl: "Video-URL (optional)",
    skill: "Fertigkeit",
    durationMin: "Dauer (Min.)",
    freePreview: "kostenlose Vorschau",
    freePreviewLabel: "Kostenlose Vorschau",
    questionsLabel: "Fragen",
    addQuestion: "Frage hinzufügen",
    saveLessonFirst: "Speichern Sie zuerst die Lektion",
    noQuestions: "Noch keine Fragen.",
    newQuestion: "Neue Frage",
    nounQuestion: "Frage",
    confirmDeleteQuestion: "Diese Frage löschen?",
    type: "Typ",
    points: "Punkte",
    pointsShort: "Pkt",
    prompt: "Fragestellung / Aussage",
    typeMc: "Multiple Choice",
    typeJnl: "Ja / Nein / Nichts",
    typeMatch: "Zuordnung (Paare)",
    options: "Optionen",
    optionsHint:
      "Leere Optionen werden beim Speichern verworfen. Markieren Sie die richtige Option mit dem Radioknopf.",
    correctAria: (letter: string) => `Richtige Antwort ${letter}`,
    correctAnswer: "Richtige Antwort",
    pairs: "Paare",
    pairsHint:
      "Linke Einträge werden dem gleichnummerierten rechten Eintrag zugeordnet (1→1, 2→2, …). Alle Paare müssen vollständig sein.",
    leftN: (n: number) => `Links ${n}`,
    rightN: (n: number) => `Rechts ${n}`,
    noModules: "Noch keine Module für diesen Kurs. Fügen Sie unten das erste hinzu.",
    addModule: "Modul hinzufügen",
  },
  fa: {
    headingPrefix: "سرفصل‌های کلاس",
    subtitle:
      "ماژول‌ها، درس‌ها و پرسش‌های این کلاس را اینجا مدیریت کنید. پیش از افزودن مورد فرزند، ابتدا مورد والد را ذخیره کنید.",
    save: "ذخیره",
    delete: "حذف",
    remove: "حذف",
    unsaved: "ذخیره‌نشده",
    savedToast: "ذخیره شد.",
    deletedToast: "حذف شد.",
    actionFailed: "انجام عملیات ناموفق بود",
    failures: {
      unauthorized: "اجازهٔ انجام این تغییر را ندارید.",
      invalid_input:
        "فیلدها را بررسی کنید: متن فارسی الزامی است، نشانیها باید معتبر باشند و جفت‌های تطبیق باید کامل باشند.",
      delete_failed: "سرور نتوانست این مورد را حذف کند.",
    } as Record<string, string>,
    newModule: "ماژول جدید",
    nounModule: "ماژول",
    confirmDeleteModule: "این ماژول همراه با همه درس‌ها و پرسش‌هایش حذف شود؟",
    title: "عنوان",
    sortOrder: "ترتیب",
    lessonsLabel: "درس‌ها",
    addLesson: "افزودن درس",
    saveModuleFirst: "ابتدا ماژول را ذخیره کنید",
    noLessons: "هنوز درسی افزوده نشده است.",
    newLesson: "درس جدید",
    nounLesson: "درس",
    confirmDeleteLesson: "این درس همراه با همه پرسش‌هایش حذف شود؟",
    body: "متن درس",
    videoUrl: "لینک ویدیو (اختیاری)",
    skill: "مهارت",
    durationMin: "مدت (دقیقه)",
    freePreview: "پیش‌نمایش رایگان",
    freePreviewLabel: "پیش‌نمایش رایگان",
    questionsLabel: "پرسش‌ها",
    addQuestion: "افزودن پرسش",
    saveLessonFirst: "ابتدا درس را ذخیره کنید",
    noQuestions: "هنوز پرسشی افزوده نشده است.",
    newQuestion: "پرسش جدید",
    nounQuestion: "پرسش",
    confirmDeleteQuestion: "این پرسش حذف شود؟",
    type: "نوع پرسش",
    points: "امتیاز",
    pointsShort: "امتیاز",
    prompt: "متن پرسش",
    typeMc: "چندگزینه‌ای",
    typeJnl: "Ja / Nein / Nichts",
    typeMatch: "تطبیق جفت‌ها",
    options: "گزینه‌ها",
    optionsHint:
      "گزینه‌های خالی هنگام ذخیره حذف می‌شوند. گزینه درست را با دکمهٔ رادیویی مشخص کنید.",
    correctAria: (letter: string) => `گزینه درست ${letter}`,
    correctAnswer: "پاسخ درست",
    pairs: "جفت‌ها",
    pairsHint:
      "هر مورد در ستون چپ به مورد هم‌شمارهٔ خود در ستون راست وصل می‌شود (۱→۱، ۲→۲، …). تکمیل همه جفت‌ها الزامی است.",
    leftN: (n: number) => `چپ ${n}`,
    rightN: (n: number) => `راست ${n}`,
    noModules: "هنوز ماژولی برای این کلاس ساخته نشده است. اولین ماژول را در پایین صفحه اضافه کنید.",
    addModule: "افزودن ماژول",
  },
} as const;

type UiContent = (typeof ui)[keyof typeof ui];

// --- Result toast mapping ---

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

// --- Small field atoms ---

interface LangFieldsProps {
  idPrefix: string;
  label: string;
  value: LocalizedString;
  onChange: (next: LocalizedString) => void;
  multiline?: boolean;
  rows?: number;
}

function LangFields({ idPrefix, label, value, onChange, multiline, rows }: LangFieldsProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {LANGS.map((lang) => (
          <div key={lang} className="space-y-1">
            <Label htmlFor={`${idPrefix}-${lang}`} className="text-xs text-muted-foreground">
              {LANG_LABEL[lang]}
            </Label>
            {multiline ? (
              <Textarea
                id={`${idPrefix}-${lang}`}
                dir={lang === "fa" ? "rtl" : "ltr"}
                rows={rows ?? 4}
                value={value[lang]}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
              />
            ) : (
              <Input
                id={`${idPrefix}-${lang}`}
                dir={lang === "fa" ? "rtl" : "ltr"}
                value={value[lang]}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
              />
            )}
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

function CollapsibleSection({
  open,
  onToggle,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-start hover:bg-muted/50"
      >
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
        <span className="flex-1 truncate">
          <span className="block text-sm font-medium">{title}</span>
          <span className="block text-xs text-muted-foreground">{subtitle}</span>
        </span>
      </button>
      {open && <div className="border-t p-4">{children}</div>}
    </div>
  );
}

// --- Blank factories ---

let blankCounter = 0;
function nextKey(prefix: string): string {
  blankCounter += 1;
  return `${prefix}-new-${blankCounter}`;
}

function defaultQuestionData(type: EditorQuestionType): QuestionData {
  if (type === "mc") return { kind: "mc", optionCount: 4, texts: localizedArray(), correct: "a" };
  if (type === "jnl") return { kind: "jnl", correct: "ja" };
  return { kind: "match", pairCount: 3, left: localizedArray(), right: localizedArray() };
}

function blankQuestion(lessonId: string | null): EditorQuestion {
  return {
    key: nextKey("q"),
    id: null,
    lessonId,
    type: "mc",
    prompt: emptyLocalized(),
    points: "1",
    sortOrder: "0",
    data: defaultQuestionData("mc"),
  };
}

function blankLesson(moduleId: string | null): EditorLesson {
  return {
    key: nextKey("l"),
    id: null,
    moduleId,
    title: emptyLocalized(),
    body: emptyLocalized(),
    videoUrl: "",
    skill: "allgemein",
    durationMin: "",
    isFreePreview: false,
    sortOrder: "0",
    questions: [],
  };
}

function blankModule(): EditorModule {
  return {
    key: nextKey("m"),
    id: null,
    title: emptyLocalized(),
    sortOrder: "0",
    lessons: [],
  };
}

// --- Module card ---

interface ModuleCardProps {
  moduleNode: EditorModule;
  classSlug: string;
  onPatch: (patch: Partial<EditorModule>) => void;
  onRemove: () => void;
  onAddLesson: () => void;
  renderLesson: (lesson: EditorLesson) => React.ReactNode;
}

function ModuleCard({ moduleNode, classSlug, onPatch, onRemove, onAddLesson, renderLesson }: ModuleCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = ui[language];
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const fd = new FormData();
    if (moduleNode.id) fd.set("id", moduleNode.id);
    fd.set("classSlug", classSlug);
    fd.set("titleEn", moduleNode.title.en);
    fd.set("titleDe", moduleNode.title.de);
    fd.set("titleFa", moduleNode.title.fa);
    fd.set("sortOrder", moduleNode.sortOrder.trim() === "" ? "0" : moduleNode.sortOrder);

    startTransition(() => {
      void (async () => {
        const result = await upsertLmsModule(fd);
        reportResult(toast, result, t);
        if (result.success) {
          if (result.id && !moduleNode.id) onPatch({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!moduleNode.id || !window.confirm(t.confirmDeleteModule)) return;
    const fd = new FormData();
    fd.set("id", moduleNode.id);
    fd.set("classSlug", classSlug);

    startTransition(() => {
      void (async () => {
        const result = await deleteLmsModule(fd);
        reportResult(toast, result, t, t.nounModule);
        if (result.success) router.refresh();
      })();
    });
  };

  return (
    <Card className="border-2">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <CardTitle className="text-base">
          {moduleNode.title.fa || moduleNode.title.en || t.newModule}
          {!moduleNode.id && (
            <span className="ms-2 align-middle text-xs font-normal text-muted-foreground">{t.unsaved}</span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            {t.save}
          </Button>
          {moduleNode.id ? (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="me-1 h-4 w-4" />
              {t.delete}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onRemove} disabled={isPending}>
              {t.remove}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <LangFields
          idPrefix={`module-${moduleNode.key}-title`}
          label={t.title}
          value={moduleNode.title}
          onChange={(title) => onPatch({ title })}
        />
        <NumberField
          id={`module-${moduleNode.key}-sort`}
          label={t.sortOrder}
          value={moduleNode.sortOrder}
          onChange={(sortOrder) => onPatch({ sortOrder })}
          min={0}
        />

        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {t.lessonsLabel} ({moduleNode.lessons.length})
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddLesson}
              disabled={!moduleNode.id}
              title={moduleNode.id ? undefined : t.saveModuleFirst}
            >
              <Plus className="me-1 h-4 w-4" />
              {t.addLesson}
            </Button>
          </div>
          {moduleNode.lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noLessons}</p>
          ) : (
            <div className="space-y-2">
              {moduleNode.lessons.map(renderLesson)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Lesson card ---

interface LessonCardProps {
  lesson: EditorLesson;
  classSlug: string;
  onPatch: (patch: Partial<EditorLesson>) => void;
  onRemove: () => void;
  onAddQuestion: () => void;
  renderQuestion: (question: EditorQuestion) => React.ReactNode;
}

function LessonCard({ lesson, classSlug, onPatch, onRemove, onAddQuestion, renderQuestion }: LessonCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = ui[language];
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const fd = new FormData();
    if (lesson.id) fd.set("id", lesson.id);
    if (lesson.moduleId) fd.set("moduleId", lesson.moduleId);
    fd.set("classSlug", classSlug);
    fd.set("titleEn", lesson.title.en);
    fd.set("titleDe", lesson.title.de);
    fd.set("titleFa", lesson.title.fa);
    fd.set("bodyEn", lesson.body.en);
    fd.set("bodyDe", lesson.body.de);
    fd.set("bodyFa", lesson.body.fa);
    if (lesson.videoUrl.trim()) fd.set("videoUrl", lesson.videoUrl.trim());
    fd.set("skill", lesson.skill);
    if (lesson.durationMin.trim()) fd.set("durationMin", lesson.durationMin.trim());
    if (lesson.isFreePreview) fd.set("isFreePreview", "on");
    fd.set("sortOrder", lesson.sortOrder.trim() === "" ? "0" : lesson.sortOrder);

    startTransition(() => {
      void (async () => {
        const result = await upsertLmsLesson(fd);
        reportResult(toast, result, t);
        if (result.success) {
          if (result.id && !lesson.id) onPatch({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!lesson.id || !window.confirm(t.confirmDeleteLesson)) return;
    const fd = new FormData();
    fd.set("id", lesson.id);
    fd.set("classSlug", classSlug);

    startTransition(() => {
      void (async () => {
        const result = await deleteLmsLesson(fd);
        reportResult(toast, result, t, t.nounLesson);
        if (result.success) router.refresh();
      })();
    });
  };

  return (
    <CollapsibleSection
      open={open}
      onToggle={() => setOpen((v) => !v)}
      title={lesson.title.fa || lesson.title.en || t.newLesson}
      subtitle={`${SKILL_LABELS[lesson.skill][language]}${
        lesson.isFreePreview ? ` · ${t.freePreview}` : ""
      }${!lesson.id ? ` · ${t.unsaved}` : ""}`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            {t.save}
          </Button>
          {lesson.id ? (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="me-1 h-4 w-4" />
              {t.delete}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onRemove} disabled={isPending}>
              {t.remove}
            </Button>
          )}
        </div>

        <LangFields
          idPrefix={`lesson-${lesson.key}-title`}
          label={t.title}
          value={lesson.title}
          onChange={(title) => onPatch({ title })}
        />
        <LangFields
          idPrefix={`lesson-${lesson.key}-body`}
          label={t.body}
          value={lesson.body}
          onChange={(body) => onPatch({ body })}
          multiline
          rows={4}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor={`lesson-${lesson.key}-video`}>{t.videoUrl}</Label>
            <Input
              id={`lesson-${lesson.key}-video`}
              type="url"
              placeholder="https://…"
              value={lesson.videoUrl}
              onChange={(e) => onPatch({ videoUrl: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`lesson-${lesson.key}-skill`}>{t.skill}</Label>
            <Select value={lesson.skill} onValueChange={(skill) => onPatch({ skill: skill as LmsSkill })}>
              <SelectTrigger id={`lesson-${lesson.key}-skill`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILLS.map((skill) => (
                  <SelectItem key={skill} value={skill}>
                    {SKILL_LABELS[skill][language]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumberField
            id={`lesson-${lesson.key}-duration`}
            label={t.durationMin}
            value={lesson.durationMin}
            onChange={(durationMin) => onPatch({ durationMin })}
            min={0}
          />
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`lesson-${lesson.key}-free`}
              checked={lesson.isFreePreview}
              onCheckedChange={(checked) => onPatch({ isFreePreview: checked === true })}
            />
            <Label htmlFor={`lesson-${lesson.key}-free`}>{t.freePreviewLabel}</Label>
          </div>
          <NumberField
            id={`lesson-${lesson.key}-sort`}
            label={t.sortOrder}
            value={lesson.sortOrder}
            onChange={(sortOrder) => onPatch({ sortOrder })}
            min={0}
          />
        </div>

        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {t.questionsLabel} ({lesson.questions.length})
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddQuestion}
              disabled={!lesson.id}
              title={lesson.id ? undefined : t.saveLessonFirst}
            >
              <Plus className="me-1 h-4 w-4" />
              {t.addQuestion}
            </Button>
          </div>
          {lesson.questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noQuestions}</p>
          ) : (
            <div className="space-y-2">
              {lesson.questions.map(renderQuestion)}
            </div>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}

// --- Question card ---

interface QuestionCardProps {
  question: EditorQuestion;
  classSlug: string;
  onPatch: (patch: Partial<EditorQuestion>) => void;
  onRemove: () => void;
}

function QuestionCard({ question, classSlug, onPatch, onRemove }: QuestionCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = ui[language];
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const questionTypeLabel = (type: EditorQuestionType) =>
    type === "mc" ? t.typeMc : type === "jnl" ? t.typeJnl : t.typeMatch;

  const handleTypeChange = (type: string) => {
    const nextType = type as EditorQuestionType;
    onPatch({ type: nextType, data: defaultQuestionData(nextType) });
  };

  const handleSave = () => {
    const fd = new FormData();
    if (question.id) fd.set("id", question.id);
    if (question.lessonId) fd.set("lessonId", question.lessonId);
    fd.set("classSlug", classSlug);
    fd.set("type", question.type);
    fd.set("promptEn", question.prompt.en);
    fd.set("promptDe", question.prompt.de);
    fd.set("promptFa", question.prompt.fa);
    fd.set("points", question.points.trim() === "" ? "1" : question.points);
    fd.set("sortOrder", question.sortOrder.trim() === "" ? "0" : question.sortOrder);

    const data = question.data;
    if (data.kind === "mc") {
      fd.set("optionCount", String(data.optionCount));
      LETTERS.forEach((letter, i) => {
        const text = data.texts[i];
        if (!text) return;
        fd.set(`optionText${letter.toUpperCase()}En`, text.en);
        fd.set(`optionText${letter.toUpperCase()}De`, text.de);
        fd.set(`optionText${letter.toUpperCase()}Fa`, text.fa);
      });
      fd.set("correctOption", data.correct);
    } else if (data.kind === "jnl") {
      fd.set("correctJnl", data.correct);
    } else {
      fd.set("pairCount", String(data.pairCount));
      INDICES.forEach((i) => {
        const left = data.left[i];
        const right = data.right[i];
        if (!left || !right) return;
        fd.set(`leftText${i + 1}En`, left.en);
        fd.set(`leftText${i + 1}De`, left.de);
        fd.set(`leftText${i + 1}Fa`, left.fa);
        fd.set(`rightLabel${i + 1}En`, right.en);
        fd.set(`rightLabel${i + 1}De`, right.de);
        fd.set(`rightLabel${i + 1}Fa`, right.fa);
      });
    }

    startTransition(() => {
      void (async () => {
        const result = await upsertLmsQuestion(fd);
        reportResult(toast, result, t);
        if (result.success) {
          if (result.id && !question.id) onPatch({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!question.id || !window.confirm(t.confirmDeleteQuestion)) return;
    const fd = new FormData();
    fd.set("id", question.id);
    fd.set("classSlug", classSlug);

    startTransition(() => {
      void (async () => {
        const result = await deleteLmsQuestion(fd);
        reportResult(toast, result, t, t.nounQuestion);
        if (result.success) router.refresh();
      })();
    });
  };

  const promptSnippet =
    question.prompt.fa || question.prompt.en || question.prompt.de || t.newQuestion;

  return (
    <CollapsibleSection
      open={open}
      onToggle={() => setOpen((v) => !v)}
      title={promptSnippet}
      subtitle={`${question.type.toUpperCase()} · ${question.points || "1"} ${t.pointsShort}${
        !question.id ? ` · ${t.unsaved}` : ""
      }`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            {t.save}
          </Button>
          {question.id ? (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="me-1 h-4 w-4" />
              {t.delete}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onRemove} disabled={isPending}>
              {t.remove}
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>{t.type}</Label>
            <Select value={question.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {questionTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumberField
            id={`question-${question.key}-points`}
            label={t.points}
            value={question.points}
            onChange={(points) => onPatch({ points })}
            min={0}
          />
          <NumberField
            id={`question-${question.key}-sort`}
            label={t.sortOrder}
            value={question.sortOrder}
            onChange={(sortOrder) => onPatch({ sortOrder })}
            min={0}
          />
        </div>

        <LangFields
          idPrefix={`question-${question.key}-prompt`}
          label={t.prompt}
          value={question.prompt}
          onChange={(prompt) => onPatch({ prompt })}
          multiline
          rows={2}
        />

        {question.data.kind === "mc" && (
          <McSubForm data={question.data} questionKey={question.key} onChange={(data) => onPatch({ data })} />
        )}
        {question.data.kind === "jnl" && (
          <JnlSubForm data={question.data} onChange={(data) => onPatch({ data })} />
        )}
        {question.data.kind === "match" && (
          <MatchSubForm data={question.data} onChange={(data) => onPatch({ data })} />
        )}
      </div>
    </CollapsibleSection>
  );
}

function McSubForm({
  data,
  questionKey,
  onChange,
}: {
  data: McState;
  questionKey: string;
  onChange: (next: QuestionData) => void;
}) {
  const { language } = useLanguage();
  const t = ui[language];

  const setCount = (delta: number) => {
    const optionCount = Math.min(Math.max(data.optionCount + delta, 1), LETTERS.length);
    onChange({ ...data, optionCount });
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{t.options}</div>
        <div className="flex items-center gap-1">
          <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setCount(-1)} disabled={data.optionCount <= 1}>
            −
          </Button>
          <span className="w-8 text-center text-sm">{data.optionCount}</span>
          <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setCount(1)} disabled={data.optionCount >= LETTERS.length}>
            +
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t.optionsHint}</p>
      {LETTERS.slice(0, data.optionCount).map((letter, i) => {
        const text = data.texts[i];
        if (!text) return null;
        return (
          <div key={letter} className="flex items-end gap-2">
            <label className="flex flex-col items-center gap-1 pb-1 text-xs">
              <input
                type="radio"
                name={`correct-${questionKey}`}
                checked={data.correct === letter}
                onChange={() => onChange({ ...data, correct: letter })}
                aria-label={t.correctAria(letter)}
                className="h-4 w-4"
              />
              {letter.toUpperCase()}
            </label>
            <div className="grid flex-1 gap-2 sm:grid-cols-3">
              {LANGS.map((lang) => (
                <Input
                  key={lang}
                  dir={lang === "fa" ? "rtl" : "ltr"}
                  placeholder={`${letter}) ${LANG_LABEL[lang]}`}
                  value={text[lang]}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      texts: data.texts.map((entry, j) => (j === i ? { ...entry, [lang]: e.target.value } : entry)),
                    })
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function JnlSubForm({
  data,
  onChange,
}: {
  data: JnlState;
  onChange: (next: QuestionData) => void;
}) {
  const { language } = useLanguage();
  const t = ui[language];

  return (
    <div className="space-y-1 rounded-lg border border-dashed p-3 sm:w-64">
      <Label>{t.correctAnswer}</Label>
      <Select value={data.correct} onValueChange={(correct) => onChange({ kind: "jnl", correct: correct as JnlValue })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {JNL_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MatchSubForm({
  data,
  onChange,
}: {
  data: MatchState;
  onChange: (next: QuestionData) => void;
}) {
  const { language } = useLanguage();
  const t = ui[language];

  const setCount = (delta: number) => {
    const pairCount = Math.min(Math.max(data.pairCount + delta, 1), INDICES.length);
    onChange({ ...data, pairCount });
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{t.pairs}</div>
        <div className="flex items-center gap-1">
          <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setCount(-1)} disabled={data.pairCount <= 1}>
            −
          </Button>
          <span className="w-8 text-center text-sm">{data.pairCount}</span>
          <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setCount(1)} disabled={data.pairCount >= INDICES.length}>
            +
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t.pairsHint}</p>
      {INDICES.slice(0, data.pairCount).map((i) => {
        const left = data.left[i];
        const right = data.right[i];
        if (!left || !right) return null;
        return (
          <div key={i} className="grid gap-2 rounded-md border p-2 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">{t.leftN(i + 1)}</div>
              <div className="grid gap-1 sm:grid-cols-3">
                {LANGS.map((lang) => (
                  <Input
                    key={lang}
                    dir={lang === "fa" ? "rtl" : "ltr"}
                    placeholder={LANG_LABEL[lang]}
                    value={left[lang]}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        left: data.left.map((entry, j) => (j === i ? { ...entry, [lang]: e.target.value } : entry)),
                      })
                    }
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">{t.rightN(i + 1)}</div>
              <div className="grid gap-1 sm:grid-cols-3">
                {LANGS.map((lang) => (
                  <Input
                    key={lang}
                    dir={lang === "fa" ? "rtl" : "ltr"}
                    placeholder={LANG_LABEL[lang]}
                    value={right[lang]}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        right: data.right.map((entry, j) => (j === i ? { ...entry, [lang]: e.target.value } : entry)),
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Root editor ---

export function LmsEditor({
  classSlug,
  classTitle,
  initialTree,
}: {
  classSlug: string;
  classTitle: LocalizedString;
  initialTree: EditorModule[];
}) {
  const { language } = useLanguage();
  const t = ui[language];
  const [modules, setModules] = useState<EditorModule[]>(initialTree);

  const displayTitle = classTitle[language] || classTitle.fa || classTitle.en;

  const patchModule = useCallback((key: string, patch: Partial<EditorModule>) => {
    setModules((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  }, []);

  const patchLesson = useCallback((moduleKey: string, lessonKey: string, patch: Partial<EditorLesson>) => {
    setModules((prev) =>
      prev.map((m) =>
        m.key === moduleKey
          ? { ...m, lessons: m.lessons.map((l) => (l.key === lessonKey ? { ...l, ...patch } : l)) }
          : m
      )
    );
  }, []);

  const patchQuestion = useCallback(
    (moduleKey: string, lessonKey: string, questionKey: string, patch: Partial<EditorQuestion>) => {
      setModules((prev) =>
        prev.map((m) =>
          m.key === moduleKey
            ? {
                ...m,
                lessons: m.lessons.map((l) =>
                  l.key === lessonKey
                    ? {
                        ...l,
                        questions: l.questions.map((q) =>
                          q.key === questionKey ? { ...q, ...patch } : q
                        ),
                      }
                    : l
                ),
              }
            : m
        )
      );
    },
    []
  );

  const addModule = () => setModules((prev) => [...prev, blankModule()]);
  const removeModule = (key: string) => setModules((prev) => prev.filter((m) => m.key !== key));

  const addLesson = (moduleKey: string) =>
    setModules((prev) =>
      prev.map((m) =>
        m.key === moduleKey ? { ...m, lessons: [...m.lessons, blankLesson(m.id)] } : m
      )
    );
  const removeLesson = (moduleKey: string, lessonKey: string) =>
    setModules((prev) =>
      prev.map((m) =>
        m.key === moduleKey ? { ...m, lessons: m.lessons.filter((l) => l.key !== lessonKey) } : m
      )
    );

  const addQuestion = (moduleKey: string, lessonKey: string) =>
    setModules((prev) =>
      prev.map((m) =>
        m.key === moduleKey
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.key === lessonKey ? { ...l, questions: [...l.questions, blankQuestion(l.id)] } : l
              ),
            }
          : m
      )
    );
  const removeQuestion = (moduleKey: string, lessonKey: string, questionKey: string) =>
    setModules((prev) =>
      prev.map((m) =>
        m.key === moduleKey
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.key === lessonKey
                  ? { ...l, questions: l.questions.filter((q) => q.key !== questionKey) }
                  : l
              ),
            }
          : m
      )
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t.headingPrefix} · {displayTitle}
        </h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      {modules.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          en={ui.en.noModules}
          de={ui.de.noModules}
          fa={ui.fa.noModules}
        />
      ) : (
        modules.map((moduleNode) => (
          <ModuleCard
            key={moduleNode.key}
            moduleNode={moduleNode}
            classSlug={classSlug}
            onPatch={(patch) => patchModule(moduleNode.key, patch)}
            onRemove={() => removeModule(moduleNode.key)}
            onAddLesson={() => addLesson(moduleNode.key)}
            renderLesson={(lesson) => (
              <LessonCard
                key={lesson.key}
                lesson={lesson}
                classSlug={classSlug}
                onPatch={(patch) => patchLesson(moduleNode.key, lesson.key, patch)}
                onRemove={() => removeLesson(moduleNode.key, lesson.key)}
                onAddQuestion={() => addQuestion(moduleNode.key, lesson.key)}
                renderQuestion={(question) => (
                  <QuestionCard
                    key={question.key}
                    question={question}
                    classSlug={classSlug}
                    onPatch={(patch) => patchQuestion(moduleNode.key, lesson.key, question.key, patch)}
                    onRemove={() => removeQuestion(moduleNode.key, lesson.key, question.key)}
                  />
                )}
              />
            )}
          />
        ))
      )}

      <Button variant="outline" onClick={addModule}>
        <Plus className="me-1 h-4 w-4" />
        {t.addModule}
      </Button>
    </div>
  );
}
