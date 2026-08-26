"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Language, LocalizedString } from "@/lib/types";
import { createClient } from "@/lib/supabase/browser";
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

// --- Result toast mapping ---

const FAILURE_DESCRIPTIONS: Record<string, string> = {
  unauthorized: "Your session is not authorized for this change.",
  invalid_input:
    "Check the fields: Persian text is required, section duration must be 1-240 minutes, match pairs must be complete.",
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
        title: "Unsupported audio format",
        description: "Use MP3, WAV, OGG or WebM.",
      });
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      toast({
        variant: "destructive",
        title: "Audio too large",
        description: "The file must be 15 MB or smaller.",
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
      toast({ title: "Audio uploaded. Save the question to persist it." });
    } catch (error) {
      console.error("Audio upload failed:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload the audio file.",
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
    { value: "0", label: "No audio" },
    { value: "1", label: "Play once" },
    { value: "2", label: "Play twice" },
  ];

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3">
      <div className="text-sm font-medium">Audio</div>

      {question.audioPath ? (
        <div className="space-y-2">
          <audio controls preload="none" src={publicAudioUrl(question.audioPath)} className="w-full" />
          <p className="truncate text-xs text-muted-foreground">
            {question.audioPath}
            {question.audioFileName ? ` · ${question.audioFileName}` : ""}
          </p>
          <Button size="sm" variant="outline" onClick={handleClear} disabled={isUploading}>
            Clear
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No audio attached.</p>
      )}

      {pendingUrl && <audio controls src={pendingUrl} className="w-full" />}

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="file"
          accept=".mp3,.wav,.ogg,.webm"
          disabled={isUploading || !examId}
          aria-label="Upload audio file"
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
            Uploading…
          </span>
        )}
      </div>

      <div className="space-y-1 sm:w-64">
        <Label>Playback</Label>
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
        reportResult(toast, result);
        if (result.success) {
          if (result.id && !examNode.id) onPatch({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!examNode.id || !window.confirm("Delete this exam with all its sections and questions?")) return;
    const fd = new FormData();
    fd.set("id", examNode.id);

    startTransition(() => {
      void (async () => {
        const result = await deleteMockExam(fd);
        reportResult(toast, result, "Exam");
        if (result.success) router.push("/admin/exams");
      })();
    });
  };

  return (
    <Card className="border-2">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <CardTitle className="text-base">
          {examNode.title.fa || examNode.title.en || "New mock exam"}
          {!examNode.id && (
            <span className="ms-2 align-middle text-xs font-normal text-muted-foreground">unsaved</span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            Save
          </Button>
          {examNode.id ? (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="me-1 h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor={`exam-${examNode.key}-code`}>Code</Label>
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
                    {code === "testdaf_paper" ? "TestDaF (paper)" : "TestDaF (digital)"}
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
            <Label htmlFor={`exam-${examNode.key}-active`}>Active (visible to students)</Label>
          </div>
        </div>

        <LangInputs
          idPrefix={`exam-${examNode.key}-title`}
          label="Title"
          value={examNode.title}
          onChange={(title) => onPatch({ title })}
        />

        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Sections ({examNode.sections.length})</div>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddSection}
              disabled={!examNode.id}
              title={examNode.id ? undefined : "Save the exam first"}
            >
              <Plus className="me-1 h-4 w-4" />
              Add section
            </Button>
          </div>
          {examNode.sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sections yet.</p>
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
        reportResult(toast, result);
        if (result.success) {
          if (result.id && !sectionNode.id) onPatch({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!sectionNode.id || !window.confirm("Delete this section with all its questions?")) return;
    const fd = new FormData();
    fd.set("id", sectionNode.id);
    fd.set("examId", examId);

    startTransition(() => {
      void (async () => {
        const result = await deleteMockSection(fd);
        reportResult(toast, result, "Section");
        if (result.success) router.refresh();
      })();
    });
  };

  return (
    <CollapsibleSection
      open={open}
      onToggle={() => setOpen((v) => !v)}
      title={sectionNode.section === "hoeren" ? "Hören (Listening)" : "Lesen (Reading)"}
      subtitle={`${sectionNode.durationMin || "?"} min${!sectionNode.id ? " · unsaved" : ""}`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            Save section
          </Button>
          {sectionNode.id ? (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="me-1 h-4 w-4" />
              Delete section
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onRemove} disabled={isPending}>
              Remove
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor={`section-${sectionNode.key}-kind`}>Skill</Label>
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
                    {kind === "hoeren" ? "Hören (Listening)" : "Lesen (Reading)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumberField
            id={`section-${sectionNode.key}-duration`}
            label="Duration (min, 1–240)"
            value={sectionNode.durationMin}
            onChange={(durationMin) => onPatch({ durationMin })}
            min={1}
          />
          <NumberField
            id={`section-${sectionNode.key}-sort`}
            label="Sort order"
            value={sectionNode.sortOrder}
            onChange={(sortOrder) => onPatch({ sortOrder })}
            min={0}
          />
        </div>

        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Questions ({sectionNode.questions.length})</div>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddQuestion}
              disabled={!sectionNode.id}
              title={sectionNode.id ? undefined : "Save the section first"}
            >
              <Plus className="me-1 h-4 w-4" />
              Add question
            </Button>
          </div>
          {sectionNode.questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions yet.</p>
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
}

function QuestionCard({ question, examId, onPatch, onRemove }: QuestionCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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
        reportResult(toast, result);
        if (result.success) {
          if (result.id && !question.id) onPatch({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!question.id || !window.confirm("Delete this question?")) return;
    const fd = new FormData();
    fd.set("id", question.id);
    fd.set("examId", examId);

    startTransition(() => {
      void (async () => {
        const result = await deleteExamQuestion(fd);
        reportResult(toast, result, "Question");
        if (result.success) router.refresh();
      })();
    });
  };

  const promptSnippet =
    question.prompt.fa || question.prompt.en || question.prompt.de || "New question";

  return (
    <CollapsibleSection
      open={open}
      onToggle={() => setOpen((v) => !v)}
      title={promptSnippet}
      subtitle={`${question.type.toUpperCase()} · ${question.points || "1"} pt${
        question.audioPath ? " · audio" : ""
      }${!question.id ? " · unsaved" : ""}`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            Save question
          </Button>
          {question.id ? (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="me-1 h-4 w-4" />
              Delete question
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onRemove} disabled={isPending}>
              Remove
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={question.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "mc" ? "Multiple choice" : type === "jnl" ? "Ja / Nein / Nichts" : "Matching pairs"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumberField
            id={`question-${question.key}-points`}
            label="Points"
            value={question.points}
            onChange={(points) => onPatch({ points })}
            min={1}
          />
          <NumberField
            id={`question-${question.key}-sort`}
            label="Sort order"
            value={question.sortOrder}
            onChange={(sortOrder) => onPatch({ sortOrder })}
            min={0}
          />
        </div>

        <LangTextareas
          idPrefix={`question-${question.key}-prompt`}
          label="Prompt / statement"
          value={question.prompt}
          onChange={(prompt) => onPatch({ prompt })}
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
  const setCount = (delta: number) => {
    const optionCount = Math.min(Math.max(data.optionCount + delta, 1), LETTERS.length);
    onChange({ ...data, optionCount });
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Options</div>
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
      <p className="text-xs text-muted-foreground">
        Empty options are dropped on save. Mark the correct one with the radio button.
      </p>
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
                aria-label={`Correct answer ${letter}`}
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
                      texts: data.texts.map((t, j) => (j === i ? { ...t, [lang]: e.target.value } : t)),
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
  return (
    <div className="space-y-1 rounded-lg border border-dashed p-3 sm:w-64">
      <Label>Correct answer</Label>
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
  const setCount = (delta: number) => {
    const pairCount = Math.min(Math.max(data.pairCount + delta, 1), INDICES.length);
    onChange({ ...data, pairCount });
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Pairs</div>
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
      <p className="text-xs text-muted-foreground">
        Left items map to their same-numbered right item (1→1, 2→2, …). All pairs must be complete.
      </p>
      {INDICES.slice(0, data.pairCount).map((i) => {
        const left = data.left[i];
        const right = data.right[i];
        if (!left || !right) return null;
        return (
          <div key={i} className="grid gap-2 rounded-md border p-2 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Left {i + 1}</div>
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
                        left: data.left.map((t, j) => (j === i ? { ...t, [lang]: e.target.value } : t)),
                      })
                    }
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Right {i + 1}</div>
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
                        right: data.right.map((t, j) => (j === i ? { ...t, [lang]: e.target.value } : t)),
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
  const [exam, setExam] = useState<ExamNode>(initialExam);

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

  return (
    <div className="space-y-6">
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
        reportResult(toast, result);
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
        <CardTitle className="text-base">New mock exam</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="new-exam-code">Code</Label>
            <Select value={code} onValueChange={(value) => setCode(value as ExamCode)}>
              <SelectTrigger id="new-exam-code">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXAM_CODES.map((examCode) => (
                  <SelectItem key={examCode} value={examCode}>
                    {examCode === "testdaf_paper" ? "TestDaF (paper)" : "TestDaF (digital)"}
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
            <Label htmlFor="new-exam-active">Active (visible to students)</Label>
          </div>
        </div>

        <LangInputs idPrefix="new-exam-title" label="Title" value={title} onChange={setTitle} />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            Create exam
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
