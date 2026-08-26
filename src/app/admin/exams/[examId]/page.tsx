
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ExamEditor,
  type ExamCode,
  type ExamNode,
  type JnlValue,
  type MatchState,
  type McState,
  type MockSectionKind,
  type QuestionData,
  type QuestionNode,
  type SectionNode,
} from "@/components/admin/exam-editor";
import type { LocalizedString } from "@/lib/types";

// The tree must reflect live DB state (admin RLS read through the request-bound
// client), never a build-time snapshot.
export const dynamic = 'force-dynamic';

// --- Local row interfaces (DB shapes for this page only) ---

interface ExamRow {
  id: string;
  code: string;
  title: unknown;
  is_active: boolean;
}

interface SectionRow {
  id: string;
  exam_id: string;
  section: string;
  duration_min: number;
  sort_order: number;
}

interface QuestionRow {
  id: string;
  section_id: string | null;
  type: string;
  prompt: unknown;
  payload: unknown;
  answer_key: unknown;
  points: number;
  sort_order: number;
  audio_path: string | null;
  plays_allowed: number;
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

function toQuestionState(row: QuestionRow): Pick<QuestionNode, "type" | "data"> {
  if (row.type === "jnl") return { type: "jnl", data: toJnlState(row.answer_key) };
  if (row.type === "match") return { type: "match", data: toMatchState(row.payload) };
  return { type: "mc", data: toMcState(row.payload, row.answer_key) };
}

// --- Row → editor-node mapping ---

function mapQuestion(row: QuestionRow): QuestionNode {
  const { type, data } = toQuestionState(row);
  return {
    key: `db-${row.id}`,
    id: row.id,
    sectionId: row.section_id,
    type,
    prompt: asLocalized(row.prompt),
    points: String(row.points),
    sortOrder: String(row.sort_order),
    data,
    audioPath: row.audio_path ?? "",
    playsAllowed: row.plays_allowed ?? 0,
  };
}

function mapSection(row: SectionRow, questions: QuestionNode[]): SectionNode {
  return {
    key: `db-${row.id}`,
    id: row.id,
    examId: row.exam_id,
    section: row.section as MockSectionKind,
    durationMin: String(row.duration_min),
    sortOrder: String(row.sort_order),
    questions,
  };
}

function mapExam(row: ExamRow, sections: SectionNode[]): ExamNode {
  return {
    key: `db-${row.id}`,
    id: row.id,
    title: asLocalized(row.title),
    code: row.code as ExamCode,
    isActive: row.is_active,
    sections,
  };
}

export default async function AdminExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;

  const supabase = await createClient();
  // Sections/questions are fetched once and joined in memory against this
  // exam — simpler than per-section `.in()` queries and RLS still scopes
  // every row.
  const [{ data: examData }, { data: sectionRows }, { data: questionRows }] = await Promise.all([
    supabase.from("mock_exams").select("*").eq("id", examId).maybeSingle(),
    supabase.from("mock_sections").select("*").eq("exam_id", examId).order("sort_order"),
    supabase.from("questions").select("*").not("section_id", "is", null).order("sort_order"),
  ]);

  const exam = examData as ExamRow | null;
  if (!exam) notFound();

  const sections = ((sectionRows ?? []) as SectionRow[]).filter(
    (sectionRow) => sectionRow.exam_id === exam.id
  );
  const sectionIds = new Set(sections.map((s) => s.id));
  const questions = ((questionRows ?? []) as QuestionRow[]).filter(
    (questionRow) => questionRow.section_id !== null && sectionIds.has(questionRow.section_id)
  );

  const tree = mapExam(
    exam,
    sections.map((sectionRow) =>
      mapSection(
        sectionRow,
        questions.filter((q) => q.section_id === sectionRow.id).map(mapQuestion)
      )
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Mock exam · {tree.title.en || tree.title.fa}
        </h1>
        <p className="text-muted-foreground">
          Sections and questions for “{tree.code}”. Save parent items before adding children.
        </p>
      </div>
      <ExamEditor initialExam={tree} />
    </div>
  );
}
