
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExamCreateForm } from "@/components/admin/exam-editor";
import type { LocalizedString } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  const exams = (examData ?? []) as ExamRow[];
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mock Exams</h1>
        <p className="text-muted-foreground">
          Author the TestDaF simulator blueprints (Lesen / Hören sections and their questions).
        </p>
      </div>

      <ExamCreateForm />

      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No mock exams yet. Create the first one above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => {
            const title = asLocalized(exam.title);
            return (
              <Card key={exam.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span
                      aria-label={exam.is_active ? "Active" : "Inactive"}
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        exam.is_active ? "bg-emerald-500" : "bg-muted-foreground/40"
                      }`}
                    />
                    {title.en || title.fa}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline">{exam.code}</Badge>
                    <span>
                      {sectionCounts.get(exam.id) ?? 0} sections ·{" "}
                      {questionCounts.get(exam.id) ?? 0} questions
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex justify-end">
                  <Button asChild size="sm">
                    <Link href={`/admin/exams/${exam.id}`}>
                      Manage
                      <ArrowRight className="ms-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
