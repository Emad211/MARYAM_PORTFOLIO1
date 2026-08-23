
import { notFound } from "next/navigation";
import { getClasses } from "@/lib/cms-store";
import { createClient } from "@/lib/supabase/server";
import {
  LmsEditor,
  type EditorLesson,
  type EditorModule,
  type EditorQuestion,
  type JnlValue,
  type LmsSkill,
  type MatchState,
  type McState,
  type QuestionData,
} from "@/components/admin/lms-editor";
import type { LocalizedString } from "@/lib/types";

// The tree must reflect live DB state (admin RLS read through the request-bound
// client), never a build-time snapshot.
export const dynamic = 'force-dynamic';

// --- Local row interfaces (DB shapes for this page only) ---

interface ModuleRow {
  id: string;
  class_slug: string;
  title: unknown;
  sort_order: number;
}

interface LessonRow {
  id: string;
  module_id: string;
  title: unknown;
  body: unknown;
  video_url: string | null;
  skill: string;
  duration_min: number | null;
  is_free_preview: boolean;
  sort_order: number;
}

interface QuestionRow {
  id: string;
  lesson_id: string;
  type: string;
  prompt: unknown;
  payload: unknown;
  answer_key: unknown;
  points: number;
  sort_order: number;
}

// --- Defensive jsonb narrowing ---

const LETTERS = ["a", "b", "c", "d", "e", "f"] as const;

function asLocalized(value: unknown): LocalizedString {
  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).en === "string" &&
    typeof (value as Record<string, unknown>).de === "string" &&
    typeof (value as Record<string, unknown>).fa === "string"
  ) {
    return value as LocalizedString;
  }
  return { en: "", de: "", fa: "" };
}

interface OptionLike {
  id: string;
  text: LocalizedString;
}

function asOptionList(value: unknown): OptionLike[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== "string") return [];
    return [{ id: record.id, text: asLocalized(record.text) }];
  });
}

function toMcState(payload: unknown, answerKey: unknown): McState {
  const texts = Array.from({ length: LETTERS.length }, () => ({ en: "", de: "", fa: "" }));
  let optionCount = 0;
  const payloadRecord = (payload ?? {}) as { options?: unknown };
  for (const option of asOptionList(payloadRecord.options)) {
    const index = LETTERS.indexOf(option.id as (typeof LETTERS)[number]);
    if (index < 0) continue;
    texts[index] = option.text;
    optionCount = Math.max(optionCount, index + 1);
  }
  const answerRecord = (answerKey ?? {}) as { correct?: unknown };
  const rawCorrect = answerRecord.correct;
  const correct =
    typeof rawCorrect === "string" &&
    LETTERS.indexOf(rawCorrect as (typeof LETTERS)[number]) < optionCount
      ? rawCorrect
      : optionCount > 0
        ? "a"
        : "";
  return {
    kind: "mc",
    optionCount: Math.min(Math.max(optionCount, 1), LETTERS.length),
    texts,
    correct,
  };
}

function toJnlState(answerKey: unknown): QuestionData {
  const answerRecord = (answerKey ?? {}) as { correct?: unknown };
  const rawCorrect = answerRecord.correct;
  const correct: JnlValue =
    rawCorrect === "nein" || rawCorrect === "nichts" ? rawCorrect : "ja";
  return { kind: "jnl", correct };
}

function toMatchState(payload: unknown): MatchState {
  const size = LETTERS.length;
  const left = Array.from({ length: size }, () => ({ en: "", de: "", fa: "" }));
  const right = Array.from({ length: size }, () => ({ en: "", de: "", fa: "" }));
  const payloadRecord = (payload ?? {}) as { left?: unknown; right?: unknown };
  let pairCount = 0;
  for (const item of asOptionList(payloadRecord.left)) {
    const index = Number(item.id.replace(/^l/, "")) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= size) continue;
    left[index] = item.text;
    pairCount = Math.max(pairCount, index + 1);
  }
  for (const item of asOptionList(payloadRecord.right)) {
    const index = Number(item.id.replace(/^r/, "")) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= size) continue;
    right[index] = item.text;
  }
  return {
    kind: "match",
    pairCount: Math.min(Math.max(pairCount, 1), size),
    left,
    right,
  };
}

function toQuestionState(row: QuestionRow): Pick<EditorQuestion, "type" | "data"> {
  if (row.type === "jnl") return { type: "jnl", data: toJnlState(row.answer_key) };
  if (row.type === "match") return { type: "match", data: toMatchState(row.payload) };
  return { type: "mc", data: toMcState(row.payload, row.answer_key) };
}

// --- Row → editor-node mapping ---

function mapQuestion(row: QuestionRow): EditorQuestion {
  const { type, data } = toQuestionState(row);
  return {
    key: `db-${row.id}`,
    id: row.id,
    lessonId: row.lesson_id,
    type,
    prompt: asLocalized(row.prompt),
    points: String(row.points),
    sortOrder: String(row.sort_order),
    data,
  };
}

function mapLesson(row: LessonRow, questions: EditorQuestion[]): EditorLesson {
  return {
    key: `db-${row.id}`,
    id: row.id,
    moduleId: row.module_id,
    title: asLocalized(row.title),
    body: asLocalized(row.body),
    videoUrl: row.video_url ?? "",
    skill: row.skill as LmsSkill,
    durationMin: row.duration_min === null ? "" : String(row.duration_min),
    isFreePreview: row.is_free_preview,
    sortOrder: String(row.sort_order),
    questions,
  };
}

function mapModule(row: ModuleRow, lessons: EditorLesson[]): EditorModule {
  return {
    key: `db-${row.id}`,
    id: row.id,
    title: asLocalized(row.title),
    sortOrder: String(row.sort_order),
    lessons,
  };
}

export default async function AdminLmsClassPage({
  params,
}: {
  params: Promise<{ classSlug: string }>;
}) {
  const { classSlug } = await params;

  const classes = await getClasses();
  const cls = classes.find((c) => c.slug === classSlug);
  if (!cls) notFound();

  const supabase = await createClient();
  const [{ data: moduleRows }, { data: lessonRows }, { data: questionRows }] = await Promise.all([
    supabase.from("modules").select("*").eq("class_slug", classSlug).order("sort_order"),
    supabase.from("lessons").select("*").order("sort_order"),
    supabase.from("questions").select("*").order("sort_order"),
  ]);

  // Lessons/questions are fetched once and joined in memory against this
  // class's modules — simpler than per-module `.in()` queries and RLS still
  // scopes every row.
  const modules = (moduleRows ?? []) as ModuleRow[];
  const lessons = (lessonRows ?? []) as LessonRow[];
  const questions = (questionRows ?? []) as QuestionRow[];

  const tree = modules.map((moduleRow) =>
    mapModule(
      moduleRow,
      lessons
        .filter((lessonRow) => lessonRow.module_id === moduleRow.id)
        .map((lessonRow) =>
          mapLesson(
            lessonRow,
            questions.filter((q) => q.lesson_id === lessonRow.id).map(mapQuestion)
          )
        )
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Curriculum · {cls.title.en || cls.title.fa}
        </h1>
        <p className="text-muted-foreground">
          Modules, lessons and questions for class “{cls.slug}”. Save parent items before adding children.
        </p>
      </div>
      <LmsEditor classSlug={classSlug} initialTree={tree} />
    </div>
  );
}
