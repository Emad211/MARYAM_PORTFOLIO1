"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronDown, Copy, FileCheck2, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Language, LocalizedString } from "@/lib/types";
import { createClient } from "@/lib/supabase/browser";
import { useLanguage } from "@/context/language-context";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  deleteExamQuestion,
  deleteMockExam,
  deleteMockSection,
  upsertExamQuestion,
  upsertMockExam,
  upsertMockSection,
  type ActionResult,
} from "@/app/actions/exam-admin-actions";

import { Button } from "@/components/ui/button";
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

// --- Editor-side tree types (mapped from DB rows by the server page) ---

export type ExamCode = "testdaf_paper" | "testdaf_digital";
export type MockSectionKind = "lesen" | "hoeren";
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

export interface QuestionNode {
  key: string;
  id: string | null;
  sectionId: string | null;
  type: EditorQuestionType;
  prompt: LocalizedString;
  /** Optional trilingual answer explanation (the "why" behind the correct answer). */
  explanation?: LocalizedString;
  points: string;
  sortOrder: string;
  data: QuestionData;
  /** Storage path inside the public `listening` bucket, e.g. exams/<examId>/1700000000000.mp3 */
  audioPath: string;
  /** 0 none / 1 once / 2 twice. */
  playsAllowed: number;
  audioFileName?: string;
}

export interface SectionNode {
  key: string;
  id: string | null;
  examId: string | null;
  section: MockSectionKind;
  durationMin: string;
  sortOrder: string;
  questions: QuestionNode[];
}

export interface ExamNode {
  key: string;
  id: string | null;
  title: LocalizedString;
  code: ExamCode;
  isActive: boolean;
  sections: SectionNode[];
}

// --- Constants ---

const LANGS: Language[] = ["en", "de", "fa"];
const LANG_LABEL: Record<Language, string> = { en: "EN", de: "DE", fa: "FA" };
const LETTERS = ["a", "b", "c", "d", "e", "f"] as const;
const INDICES = [0, 1, 2, 3, 4, 5] as const;
const EXAM_CODES: ExamCode[] = ["testdaf_paper", "testdaf_digital"];
const SECTION_KINDS: MockSectionKind[] = ["lesen", "hoeren"];
const QUESTION_TYPES: EditorQuestionType[] = ["mc", "jnl", "match"];
const JNL_VALUES: JnlValue[] = ["ja", "nein", "nichts"];

/** Mirrors the `listening` bucket's allowed_mime_types + 15 MB limit. */
const ALLOWED_AUDIO_MIME = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
];
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
};

function emptyLocalized(): LocalizedString {
  return { en: "", de: "", fa: "" };
}

function localizedArray(): LocalizedString[] {
  return INDICES.map(() => emptyLocalized());
}

function publicAudioUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listening/${path}`;
}

// --- Trilingual UI strings (Persian-first, German in Sie-form) ---

const ui = {
  en: {
    browserTitle: "Mock Exams",
    browserSubtitle:
      "Author the TestDaF simulator blueprints (Lesen / Hören sections and their questions).",
    manage: "Manage",
    activeAria: "Active",
    inactiveAria: "Inactive",
    counts: (s: number, q: number) => `${s} sections · ${q} questions`,
    empty: "No mock exams yet",
    emptySub: "Create the first one with the form above.",
    newExamForm: "New mock exam",
    codeLabel: "Code",
    codePaper: "TestDaF (paper)",
    codeDigital: "TestDaF (digital)",
    activeLabel: "Active (visible to students)",
    createExam: "Create exam",
    heading: "Mock exam",
    subtitleFor: (code: string) =>
      `Sections and questions for “${code}”. Save parent items before adding children.`,
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
        "Check the fields: Persian text is required, section duration must be 1-240 minutes, match pairs must be complete.",
      delete_failed: "The server could not delete this item.",
      not_found: "This item was not found.",
    } as Record<string, string>,
    duplicateAria: "Duplicate question",
    confirmDuplicate: "Create a copy?",
    duplicatedToast: "Copy created. Click Save on the copy to persist it.",
    explanationLabel: "Explanation (why?)",
    newMockExam: "New mock exam",
    nounExam: "Exam",
    confirmDeleteExam: "Delete this exam with all its sections and questions?",
    title: "Title",
    sectionsLabel: "Sections",
    addSection: "Add section",
    saveExamFirst: "Save the exam first",
    noSections: "No sections yet.",
    sectionKind: (kind: "lesen" | "hoeren") =>
      kind === "hoeren" ? "Hören (Listening)" : "Lesen (Reading)",
    skill: "Skill",
    durationMin: "Duration (min, 1–240)",
    sortOrder: "Sort order",
    minUnit: "min",
    confirmDeleteSection: "Delete this section with all its questions?",
    nounSection: "Section",
    saveSection: "Save section",
    questionsLabel: "Questions",
    addQuestion: "Add question",
    saveSectionFirst: "Save the section first",
    noQuestions: "No questions yet.",
    newQuestion: "New question",
    nounQuestion: "Question",
    confirmDeleteQuestion: "Delete this question?",
    type: "Question type",
    points: "Points",
    pointsShort: "pt",
    prompt: "Prompt / statement",
    typeMc: "Multiple choice",
    typeJnl: "Ja / Nein / Nichts",
    typeMatch: "Matching pairs",
    subtitleAudio: "audio",
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
    audio: "Audio",
    noAudioAttached: "No audio attached.",
    clear: "Clear",
    uploading: "Uploading…",
    uploadAria: "Upload audio file",
    playback: "Playback",
    playNone: "No audio",
    playOnce: "Play once",
    playTwice: "Play twice",
    unsupportedMime: "Unsupported audio format",
    unsupportedMimeHint: "Use MP3, WAV, OGG or WebM.",
    tooLarge: "Audio too large",
    tooLargeHint: "The file must be 15 MB or smaller.",
    uploadFailed: "Upload failed",
    uploadFailedHint: "Could not upload the audio file.",
    uploadedToast: "Audio uploaded. Save the question to persist it.",
  },
  de: {
    browserTitle: "Probetests",
    browserSubtitle:
      "Erstellen Sie die Vorlagen für den TestDaF-Simulator (Lesen-/Hören-Abschnitte und ihre Fragen).",
    manage: "Verwalten",
    activeAria: "Aktiv",
    inactiveAria: "Inaktiv",
    counts: (s: number, q: number) => `${s} Abschnitte · ${q} Fragen`,
    empty: "Noch keine Probetests",
    emptySub: "Legen Sie den ersten mit dem Formular oben an.",
    newExamForm: "Neuer Probetest",
    codeLabel: "Code",
    codePaper: "TestDaF (Papier)",
    codeDigital: "TestDaF (digital)",
    activeLabel: "Aktiv (für Studierende sichtbar)",
    createExam: "Probetest anlegen",
    heading: "Probetest",
    subtitleFor: (code: string) =>
      `Abschnitte und Fragen für „${code}“. Speichern Sie übergeordnete Elemente, bevor Sie untergeordnete hinzufügen.`,
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
        "Bitte prüfen Sie die Felder: Persischer Text ist erforderlich, die Abschnittsdauer muss 1–240 Minuten betragen, Zuordnungspaare müssen vollständig sein.",
      delete_failed: "Der Server konnte dieses Element nicht löschen.",
      not_found: "Dieses Element wurde nicht gefunden.",
    } as Record<string, string>,
    duplicateAria: "Frage duplizieren",
    confirmDuplicate: "Eine Kopie erstellen?",
    duplicatedToast: "Kopie erstellt. Klicken Sie bei der Kopie auf „Speichern“, um sie zu übernehmen.",
    explanationLabel: "Erklärung (Warum?)",
    newMockExam: "Neuer Probetest",
    nounExam: "Probetest",
    confirmDeleteExam: "Diesen Probetest samt aller Abschnitte und Fragen löschen?",
    title: "Titel",
    sectionsLabel: "Abschnitte",
    addSection: "Abschnitt hinzufügen",
    saveExamFirst: "Speichern Sie zuerst den Probetest",
    noSections: "Noch keine Abschnitte.",
    sectionKind: (kind: "lesen" | "hoeren") => (kind === "hoeren" ? "Hören" : "Lesen"),
    skill: "Fertigkeit",
    durationMin: "Dauer (Min., 1–240)",
    sortOrder: "Reihenfolge",
    minUnit: "Min.",
    confirmDeleteSection: "Diesen Abschnitt samt aller Fragen löschen?",
    nounSection: "Abschnitt",
    saveSection: "Abschnitt speichern",
    questionsLabel: "Fragen",
    addQuestion: "Frage hinzufügen",
    saveSectionFirst: "Speichern Sie zuerst den Abschnitt",
    noQuestions: "Noch keine Fragen.",
    newQuestion: "Neue Frage",
    nounQuestion: "Frage",
    confirmDeleteQuestion: "Diese Frage löschen?",
    type: "Fragetyp",
    points: "Punkte",
    pointsShort: "Pkt",
    prompt: "Fragestellung / Aussage",
    typeMc: "Multiple Choice",
    typeJnl: "Ja / Nein / Nichts",
    typeMatch: "Zuordnung (Paare)",
    subtitleAudio: "Audio",
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
    audio: "Audio",
    noAudioAttached: "Kein Audio angehängt.",
    clear: "Entfernen",
    uploading: "Wird hochgeladen…",
    uploadAria: "Audiodatei hochladen",
    playback: "Wiedergabe",
    playNone: "Kein Audio",
    playOnce: "Einmal abspielen",
    playTwice: "Zweimal abspielen",
    unsupportedMime: "Nicht unterstütztes Audioformat",
    unsupportedMimeHint: "Bitte MP3, WAV, OGG oder WebM verwenden.",
    tooLarge: "Audio zu groß",
    tooLargeHint: "Die Datei darf maximal 15 MB groß sein.",
    uploadFailed: "Upload fehlgeschlagen",
    uploadFailedHint: "Die Audiodatei konnte nicht hochgeladen werden.",
    uploadedToast: "Audio hochgeladen. Speichern Sie die Frage, um es zu übernehmen.",
  },
  fa: {
    browserTitle: "آزمون‌های آزمایشی",
    browserSubtitle:
      "طراحی آزمون‌های شبیه‌ساز TestDaF (بخش‌های Lesen / Hören و پرسش‌هایشان).",
    manage: "مدیریت",
    activeAria: "فعال",
    inactiveAria: "غیرفعال",
    counts: (s: number, q: number) => `${s} بخش · ${q} پرسش`,
    empty: "هنوز آزمون آزمایشی ساخته نشده است",
    emptySub: "اولین آزمون را با فرم بالا بسازید.",
    newExamForm: "آزمون آزمایشی جدید",
    codeLabel: "کد آزمون",
    codePaper: "TestDaF (کاغذی)",
    codeDigital: "TestDaF (دیجیتال)",
    activeLabel: "فعال (نمایش برای هنرجویان)",
    createExam: "ایجاد آزمون",
    heading: "آزمون آزمایشی",
    subtitleFor: (code: string) =>
      `بخش‌ها و پرسش‌های آزمون ${code}. پیش از افزودن مورد فرزند، ابتدا مورد والد را ذخیره کنید.`,
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
        "فیلدها را بررسی کنید: متن فارسی الزامی است، مدت بخش باید ۱ تا ۲۴۰ دقیقه باشد و جفت‌های تطبیق باید کامل باشند.",
      delete_failed: "سرور نتوانست این مورد را حذف کند.",
      not_found: "این مورد پیدا نشد.",
    } as Record<string, string>,
    duplicateAria: "کپی کردن پرسش",
    confirmDuplicate: "یک نسخه کپی ساخته شود؟",
    duplicatedToast: "کپی ساخته شد. برای ثبت نهایی، روی نسخهٔ کپی «ذخیره» را بزنید.",
    explanationLabel: "توضیح پاسخ (چرا؟)",
    newMockExam: "آزمون آزمایشی جدید",
    nounExam: "آزمون",
    confirmDeleteExam: "این آزمون همراه با همه بخش‌ها و پرسش‌هایش حذف شود؟",
    title: "عنوان",
    sectionsLabel: "بخش‌ها",
    addSection: "افزودن بخش",
    saveExamFirst: "ابتدا آزمون را ذخیره کنید",
    noSections: "هنوز بخشی افزوده نشده است.",
    sectionKind: (kind: "lesen" | "hoeren") =>
      kind === "hoeren" ? "Hören (شنیدن)" : "Lesen (خواندن)",
    skill: "مهارت",
    durationMin: "مدت (دقیقه، ۱ تا ۲۴۰)",
    sortOrder: "ترتیب",
    minUnit: "دقیقه",
    confirmDeleteSection: "این بخش همراه با همه پرسش‌هایش حذف شود؟",
    nounSection: "بخش",
    saveSection: "ذخیره بخش",
    questionsLabel: "پرسش‌ها",
    addQuestion: "افزودن پرسش",
    saveSectionFirst: "ابتدا بخش را ذخیره کنید",
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
    subtitleAudio: "صدا",
    options: "گزینه‌ها",
    optionsHint:
      "گزینه‌های خالی هنگام ذخیره حذف می‌شوند. گزینه درست را با دکمهٔ رادیویی مشخص کنید.",
    correctAria: (letter: string) => `گزینه درست ${letter}`,
    correctAnswer: "گزینه درست",
    pairs: "جفت‌ها",
    pairsHint:
      "هر مورد در ستون چپ به مورد هم‌شمارهٔ خود در ستون راست وصل می‌شود (۱→۱، ۲→۲، …). تکمیل همه جفت‌ها الزامی است.",
    leftN: (n: number) => `چپ ${n}`,
    rightN: (n: number) => `راست ${n}`,
    audio: "پخش صدا",
    noAudioAttached: "فایل صوتی پیوست نشده است.",
    clear: "حذف فایل",
    uploading: "در حال بارگذاری…",
    uploadAria: "بارگذاری فایل صوتی",
    playback: "پخش صدا",
    playNone: "بدون صدا",
    playOnce: "یک‌بار",
    playTwice: "دوبار",
    unsupportedMime: "قالب صوتی پشتیبانی نمی‌شود",
    unsupportedMimeHint: "از MP3، WAV، OGG یا WebM استفاده کنید.",
    tooLarge: "فایل صوتی بزرگ است",
    tooLargeHint: "حجم فایل باید حداکثر ۱۵ مگابایت باشد.",
    uploadFailed: "بارگذاری ناموفق بود",
    uploadFailedHint: "فایل صوتی بارگذاری نشد.",
    uploadedToast: "فایل صوتی بارگذاری شد. برای ثبت نهایی، پرسش را ذخیره کنید.",
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

function LangTextareas({
  idPrefix,
  label,
  value,
  onChange,
  rows,
}: LangFieldsProps & { rows?: number }) {
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

function blankQuestion(sectionId: string | null): QuestionNode {
  return {
    key: nextKey("q"),
    id: null,
    sectionId,
    type: "mc",
    prompt: emptyLocalized(),
    points: "1",
    sortOrder: "0",
    data: defaultQuestionData("mc"),
    audioPath: "",
    playsAllowed: 0,
  };
}

function blankSection(examId: string | null): SectionNode {
  return {
    key: nextKey("s"),
    id: null,
    examId,
    section: "lesen",
    durationMin: "10",
    sortOrder: "0",
    questions: [],
  };
}

// --- Audio block (upload + preview + replay cap) ---

function AudioBlock({
  question,
  examId,
  onPatch,
}: {
  question: QuestionNode;
  examId: string;
  onPatch: (patch: Partial<QuestionNode>) => void;
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = ui[language];
  const [isUploading, setIsUploading] = useState(false);
  // Object URL of the file being uploaded — revoked as soon as the upload
  // settles so no blob URL ever leaks.
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingUrl) return;
    return () => URL.revokeObjectURL(pendingUrl);
  }, [pendingUrl]);

  const handleFile = async (file: File) => {
    if (!ALLOWED_AUDIO_MIME.includes(file.type)) {
      toast({
        variant: "destructive",
        title: t.unsupportedMime,
        description: t.unsupportedMimeHint,
      });
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      toast({
        variant: "destructive",
        title: t.tooLarge,
        description: t.tooLargeHint,
      });
      return;
    }

    const ext = MIME_EXT[file.type] ?? "mp3";
    const path = `exams/${examId}/${Date.now()}.${ext}`;
    const objectUrl = URL.createObjectURL(file);
    setPendingUrl(objectUrl);
    setIsUploading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("listening")
        .upload(path, file, { contentType: file.type });
      if (error) throw error;

      onPatch({
        audioPath: path,
        audioFileName: file.name,
        // Listening material without a replay cap makes little sense — flip
        // "No audio" to "Play once" automatically.
        ...(question.playsAllowed === 0 ? { playsAllowed: 1 } : {}),
      });
      toast({ title: t.uploadedToast });
    } catch (error) {
      console.error("Audio upload failed:", error);
      toast({
        variant: "destructive",
        title: t.uploadFailed,
        description: error instanceof Error ? error.message : t.uploadFailedHint,
      });
    } finally {
      setIsUploading(false);
      setPendingUrl(null); // effect revokes the object URL
    }
  };

  const handleClear = () => {
    onPatch({ audioPath: "", ...(question.audioFileName ? { audioFileName: "" } : {}) });
  };

  const playOptions = [
    { value: "0", label: t.playNone },
    { value: "1", label: t.playOnce },
    { value: "2", label: t.playTwice },
  ];

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3">
      <div className="text-sm font-medium">{t.audio}</div>

      {question.audioPath ? (
        <div className="space-y-2">
          <audio controls preload="none" src={publicAudioUrl(question.audioPath)} className="w-full" />
          <p className="truncate text-xs text-muted-foreground">
            {question.audioPath}
            {question.audioFileName ? ` · ${question.audioFileName}` : ""}
          </p>
          <Button size="sm" variant="outline" onClick={handleClear} disabled={isUploading}>
            {t.clear}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t.noAudioAttached}</p>
      )}

      {pendingUrl && <audio controls src={pendingUrl} className="w-full" />}

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="file"
          accept=".mp3,.wav,.ogg,.webm"
          disabled={isUploading || !examId}
          aria-label={t.uploadAria}
          className="max-w-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // allow re-picking the same file
            if (file) void handleFile(file);
          }}
        />
        {isUploading && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.uploading}
          </span>
        )}
      </div>

      <div className="space-y-1 sm:w-64">
        <Label>{t.playback}</Label>
        <Select
          value={String(question.playsAllowed)}
          onValueChange={(playsAllowed) => onPatch({ playsAllowed: Number(playsAllowed) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {playOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// --- Exam header card ---

interface ExamCardProps {
  examNode: ExamNode;
  onPatch: (patch: Partial<ExamNode>) => void;
  onAddSection: () => void;
  renderSection: (section: SectionNode) => React.ReactNode;
}

function ExamCard({ examNode, onPatch, onAddSection, renderSection }: ExamCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = ui[language];
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const fd = new FormData();
    if (examNode.id) fd.set("id", examNode.id);
    fd.set("code", examNode.code);
    fd.set("titleEn", examNode.title.en);
    fd.set("titleDe", examNode.title.de);
    fd.set("titleFa", examNode.title.fa);
    if (examNode.isActive) fd.set("isActive", "on");

    startTransition(() => {
      void (async () => {
        const result = await upsertMockExam(fd);
        reportResult(toast, result, t);
        if (result.success) {
          if (result.id && !examNode.id) onPatch({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!examNode.id || !window.confirm(t.confirmDeleteExam)) return;
    const fd = new FormData();
    fd.set("id", examNode.id);

    startTransition(() => {
      void (async () => {
        const result = await deleteMockExam(fd);
        reportResult(toast, result, t, t.nounExam);
        if (result.success) router.push("/admin/exams");
      })();
    });
  };

  return (
    <Card className="border-2">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <CardTitle className="text-base">
          {examNode.title.fa || examNode.title.en || t.newMockExam}
          {!examNode.id && (
            <span className="ms-2 align-middle text-xs font-normal text-muted-foreground">{t.unsaved}</span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            {t.save}
          </Button>
          {examNode.id ? (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="me-1 h-4 w-4" />
              {t.delete}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor={`exam-${examNode.key}-code`}>{t.codeLabel}</Label>
            <Select
              value={examNode.code}
              onValueChange={(code) => onPatch({ code: code as ExamCode })}
            >
              <SelectTrigger id={`exam-${examNode.key}-code`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXAM_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code === "testdaf_paper" ? t.codePaper : t.codeDigital}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              id={`exam-${examNode.key}-active`}
              checked={examNode.isActive}
              onCheckedChange={(checked) => onPatch({ isActive: checked === true })}
            />
            <Label htmlFor={`exam-${examNode.key}-active`}>{t.activeLabel}</Label>
          </div>
        </div>

        <LangInputs
          idPrefix={`exam-${examNode.key}-title`}
          label={t.title}
          value={examNode.title}
          onChange={(title) => onPatch({ title })}
        />

        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {t.sectionsLabel} ({examNode.sections.length})
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddSection}
              disabled={!examNode.id}
              title={examNode.id ? undefined : t.saveExamFirst}
            >
              <Plus className="me-1 h-4 w-4" />
              {t.addSection}
            </Button>
          </div>
          {examNode.sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noSections}</p>
          ) : (
            <div className="space-y-2">{examNode.sections.map(renderSection)}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Section card ---

interface SectionCardProps {
  sectionNode: SectionNode;
  examId: string;
  onPatch: (patch: Partial<SectionNode>) => void;
  onRemove: () => void;
  onAddQuestion: () => void;
  renderQuestion: (question: QuestionNode) => React.ReactNode;
}

function SectionCard({
  sectionNode,
  examId,
  onPatch,
  onRemove,
  onAddQuestion,
  renderQuestion,
}: SectionCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = ui[language];
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const fd = new FormData();
    if (sectionNode.id) fd.set("id", sectionNode.id);
    if (sectionNode.examId) fd.set("examId", sectionNode.examId);
    fd.set("section", sectionNode.section);
    fd.set("durationMin", sectionNode.durationMin.trim() === "" ? "10" : sectionNode.durationMin.trim());
    fd.set("sortOrder", sectionNode.sortOrder.trim() === "" ? "0" : sectionNode.sortOrder);

    startTransition(() => {
      void (async () => {
        const result = await upsertMockSection(fd);
        reportResult(toast, result, t);
        if (result.success) {
          if (result.id && !sectionNode.id) onPatch({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!sectionNode.id || !window.confirm(t.confirmDeleteSection)) return;
    const fd = new FormData();
    fd.set("id", sectionNode.id);
    fd.set("examId", examId);

    startTransition(() => {
      void (async () => {
        const result = await deleteMockSection(fd);
        reportResult(toast, result, t, t.nounSection);
        if (result.success) router.refresh();
      })();
    });
  };

  return (
    <CollapsibleSection
      open={open}
      onToggle={() => setOpen((v) => !v)}
      title={t.sectionKind(sectionNode.section)}
      subtitle={`${sectionNode.durationMin || "?"} ${t.minUnit}${!sectionNode.id ? ` · ${t.unsaved}` : ""}`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            {t.saveSection}
          </Button>
          {sectionNode.id ? (
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
            <Label htmlFor={`section-${sectionNode.key}-kind`}>{t.skill}</Label>
            <Select
              value={sectionNode.section}
              onValueChange={(section) => onPatch({ section: section as MockSectionKind })}
            >
              <SelectTrigger id={`section-${sectionNode.key}-kind`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_KINDS.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {t.sectionKind(kind)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumberField
            id={`section-${sectionNode.key}-duration`}
            label={t.durationMin}
            value={sectionNode.durationMin}
            onChange={(durationMin) => onPatch({ durationMin })}
            min={1}
          />
          <NumberField
            id={`section-${sectionNode.key}-sort`}
            label={t.sortOrder}
            value={sectionNode.sortOrder}
            onChange={(sortOrder) => onPatch({ sortOrder })}
            min={0}
          />
        </div>

        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {t.questionsLabel} ({sectionNode.questions.length})
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddQuestion}
              disabled={!sectionNode.id}
              title={sectionNode.id ? undefined : t.saveSectionFirst}
            >
              <Plus className="me-1 h-4 w-4" />
              {t.addQuestion}
            </Button>
          </div>
          {sectionNode.questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noQuestions}</p>
          ) : (
            <div className="space-y-2">
              {sectionNode.questions.map(renderQuestion)}
            </div>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}

// --- Question card ---

interface QuestionCardProps {
  question: QuestionNode;
  examId: string;
  onPatch: (patch: Partial<QuestionNode>) => void;
  onRemove: () => void;
  /** Client-side clone (id→null) appended by the root editor; persisted via Save. */
  onDuplicate: () => void;
}

function QuestionCard({ question, examId, onPatch, onRemove, onDuplicate }: QuestionCardProps) {
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
    if (question.sectionId) fd.set("sectionId", question.sectionId);
    fd.set("examId", examId);
    fd.set("type", question.type);
    fd.set("promptEn", question.prompt.en);
    fd.set("promptDe", question.prompt.de);
    fd.set("promptFa", question.prompt.fa);
    const explanation = question.explanation;
    if (
      explanation &&
      (explanation.en.trim() !== "" || explanation.de.trim() !== "" || explanation.fa.trim() !== "")
    ) {
      fd.set("explanationEn", explanation.en);
      fd.set("explanationDe", explanation.de);
      fd.set("explanationFa", explanation.fa);
    }
    fd.set("points", question.points.trim() === "" ? "1" : question.points);
    fd.set("sortOrder", question.sortOrder.trim() === "" ? "0" : question.sortOrder);
    if (question.audioPath.trim()) fd.set("audioPath", question.audioPath.trim());
    fd.set("playsAllowed", String(question.playsAllowed));

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
        const result = await upsertExamQuestion(fd);
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
    fd.set("examId", examId);

    startTransition(() => {
      void (async () => {
        const result = await deleteExamQuestion(fd);
        reportResult(toast, result, t, t.nounQuestion);
        if (result.success) router.refresh();
      })();
    });
  };

  const handleDuplicate = () => {
    if (!window.confirm(t.confirmDuplicate)) return;
    onDuplicate();
    toast({ title: t.duplicatedToast });
  };

  const promptSnippet =
    question.prompt.fa || question.prompt.en || question.prompt.de || t.newQuestion;

  return (
    <CollapsibleSection
      open={open}
      onToggle={() => setOpen((v) => !v)}
      title={promptSnippet}
      subtitle={`${question.type.toUpperCase()} · ${question.points || "1"} ${t.pointsShort}${
        question.audioPath ? ` · ${t.subtitleAudio}` : ""
      }${!question.id ? ` · ${t.unsaved}` : ""}`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            {t.save}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleDuplicate}
            disabled={isPending}
            title={t.duplicateAria}
            aria-label={t.duplicateAria}
          >
            <Copy className="h-4 w-4" />
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
            min={1}
          />
          <NumberField
            id={`question-${question.key}-sort`}
            label={t.sortOrder}
            value={question.sortOrder}
            onChange={(sortOrder) => onPatch({ sortOrder })}
            min={0}
          />
        </div>

        <LangTextareas
          idPrefix={`question-${question.key}-prompt`}
          label={t.prompt}
          value={question.prompt}
          onChange={(prompt) => onPatch({ prompt })}
          rows={2}
        />

        <LangTextareas
          idPrefix={`question-${question.key}-explanation`}
          label={t.explanationLabel}
          value={question.explanation ?? emptyLocalized()}
          onChange={(explanation) => onPatch({ explanation })}
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

        <AudioBlock question={question} examId={examId} onPatch={onPatch} />
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

export function ExamEditor({ initialExam }: { initialExam: ExamNode }) {
  const { language } = useLanguage();
  const t = ui[language];
  const [exam, setExam] = useState<ExamNode>(initialExam);

  const displayTitle = exam.title[language] || exam.title.fa || exam.title.en;

  const patchExam = useCallback((key: string, patch: Partial<ExamNode>) => {
    setExam((prev) => (prev.key === key ? { ...prev, ...patch } : prev));
  }, []);

  const patchSection = useCallback((sectionKey: string, patch: Partial<SectionNode>) => {
    setExam((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.key === sectionKey ? { ...s, ...patch } : s)),
    }));
  }, []);

  const patchQuestion = useCallback(
    (sectionKey: string, questionKey: string, patch: Partial<QuestionNode>) => {
      setExam((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.key === sectionKey
            ? {
                ...s,
                questions: s.questions.map((q) => (q.key === questionKey ? { ...q, ...patch } : q)),
              }
            : s
        ),
      }));
    },
    []
  );

  const addSection = () =>
    setExam((prev) => ({ ...prev, sections: [...prev.sections, blankSection(prev.id)] }));
  const removeSection = (sectionKey: string) =>
    setExam((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.key !== sectionKey) }));

  const addQuestion = (sectionKey: string) =>
    setExam((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.key === sectionKey ? { ...s, questions: [...s.questions, blankQuestion(s.id)] } : s
      ),
    }));
  const removeQuestion = (sectionKey: string, questionKey: string) =>
    setExam((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.key === sectionKey
          ? { ...s, questions: s.questions.filter((q) => q.key !== questionKey) }
          : s
      ),
    }));

  // Exam duplicates stay client-side (no server action is pinned for them):
  // clone the node with id null so the teacher persists it via Save. The
  // cloned audioPath intentionally shares the original's storage object.
  const duplicateQuestionNode = useCallback((sectionKey: string, question: QuestionNode) => {
    setExam((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.key === sectionKey
          ? { ...s, questions: [...s.questions, { ...question, key: nextKey("q"), id: null }] }
          : s
      ),
    }));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t.heading} · {displayTitle}
        </h1>
        <p className="text-muted-foreground">{t.subtitleFor(exam.code)}</p>
      </div>

      <ExamCard
        key={exam.key}
        examNode={exam}
        onPatch={(patch) => patchExam(exam.key, patch)}
        onAddSection={addSection}
        renderSection={(section) => (
          <SectionCard
            key={section.key}
            sectionNode={section}
            examId={exam.id ?? ""}
            onPatch={(patch) => patchSection(section.key, patch)}
            onRemove={() => removeSection(section.key)}
            onAddQuestion={() => addQuestion(section.key)}
            renderQuestion={(question) => (
              <QuestionCard
                key={question.key}
                question={question}
                examId={exam.id ?? ""}
                onPatch={(patch) => patchQuestion(section.key, question.key, patch)}
                onRemove={() => removeQuestion(section.key, question.key)}
                onDuplicate={() => duplicateQuestionNode(section.key, question)}
              />
            )}
          />
        )}
      />
    </div>
  );
}

// --- New-exam form (used by the exam list page) ---

export function ExamCreateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = ui[language];
  const [code, setCode] = useState<ExamCode>("testdaf_paper");
  const [title, setTitle] = useState<LocalizedString>(emptyLocalized());
  const [isActive, setIsActive] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const fd = new FormData();
    fd.set("code", code);
    fd.set("titleEn", title.en);
    fd.set("titleDe", title.de);
    fd.set("titleFa", title.fa);
    if (isActive) fd.set("isActive", "on");

    startTransition(() => {
      void (async () => {
        const result = await upsertMockExam(fd);
        reportResult(toast, result, t);
        if (result.success) {
          setTitle(emptyLocalized());
          setIsActive(false);
          router.refresh();
        }
      })();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.newExamForm}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="new-exam-code">{t.codeLabel}</Label>
            <Select value={code} onValueChange={(value) => setCode(value as ExamCode)}>
              <SelectTrigger id="new-exam-code">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXAM_CODES.map((examCode) => (
                  <SelectItem key={examCode} value={examCode}>
                    {examCode === "testdaf_paper" ? t.codePaper : t.codeDigital}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              id="new-exam-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label htmlFor="new-exam-active">{t.activeLabel}</Label>
          </div>
        </div>

        <LangInputs idPrefix="new-exam-title" label={t.title} value={title} onChange={setTitle} />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            {t.createExam}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Exam list page body (heading + create form + grid) ---

export interface ExamListItem {
  id: string;
  code: string;
  title: LocalizedString;
  isActive: boolean;
  sectionCount: number;
  questionCount: number;
}

export function ExamBrowser({ exams }: { exams: ExamListItem[] }) {
  const { language } = useLanguage();
  const t = ui[language];

  const titleFor = (exam: ExamListItem) =>
    exam.title[language] || exam.title.fa || exam.title.en;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.browserTitle}</h1>
        <p className="text-muted-foreground">{t.browserSubtitle}</p>
      </div>

      <ExamCreateForm />

      {exams.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          en={ui.en.empty}
          de={ui.de.empty}
          fa={ui.fa.empty}
          subEn={ui.en.emptySub}
          subDe={ui.de.emptySub}
          subFa={ui.fa.emptySub}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span
                    aria-label={exam.isActive ? t.activeAria : t.inactiveAria}
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      exam.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
                    }`}
                  />
                  {titleFor(exam)}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="outline">{exam.code}</Badge>
                  <span>{t.counts(exam.sectionCount, exam.questionCount)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex justify-end">
                <Button asChild size="sm">
                  <Link href={`/admin/exams/${exam.id}`}>
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
