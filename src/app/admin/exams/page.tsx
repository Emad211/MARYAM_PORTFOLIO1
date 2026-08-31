
import { createClient } from "@/lib/supabase/server";
import { ExamBrowser, type ExamListItem } from "@/components/admin/exam-editor";
import type { LocalizedString } from "@/lib/types";

// Admin lists must always render live data, never a build-time snapshot.
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
}

interface QuestionRow {
  section_id: string | null;
}

// --- Defensive jsonb narrowing ---

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

function countBy<T>(rows: T[], keyOf: (row: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = keyOf(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export default async function AdminExamsPage() {
  const supabase = await createClient();
  const [{ data: examData }, { data: sectionData }, { data: questionData }] = await Promise.all([
    supabase.from("mock_exams").select("*").order("created_at"),
    supabase.from("mock_sections").select("id,exam_id"),
    supabase.from("questions").select("section_id").not("section_id", "is", null),
  ]);

  const rows = (examData ?? []) as ExamRow[];
  const sections = (sectionData ?? []) as SectionRow[];
  const questions = (questionData ?? []) as QuestionRow[];

  // Grouped counts: sections per exam, then questions rolled up to their
  // section's owning exam.
  const sectionCounts = countBy(sections, (s) => s.exam_id);
  const sectionToExam = new Map(sections.map((s) => [s.id, s.exam_id]));
  const questionCounts = countBy(
    questions.flatMap((q) => {
      const examId = q.section_id ? sectionToExam.get(q.section_id) : undefined;
      return examId ? [examId] : [];
    }),
    (examId) => examId
  );

  const exams: ExamListItem[] = rows.map((exam) => ({
    id: exam.id,
    code: exam.code,
    title: asLocalized(exam.title),
    isActive: exam.is_active,
    sectionCount: sectionCounts.get(exam.id) ?? 0,
    questionCount: questionCounts.get(exam.id) ?? 0,
  }));

  return <ExamBrowser exams={exams} />;
}
