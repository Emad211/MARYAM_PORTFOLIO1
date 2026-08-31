
import { notFound } from "next/navigation";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import {
  GrammarEditor,
  blankTopicNode,
  type GrammarLevel,
  type LessonOption,
  type TopicNode,
} from "@/components/admin/grammar-editor";
import type { LocalizedString } from "@/lib/types";

// The editor must reflect live DB state (admin RLS read through the
// request-bound client), never a build-time snapshot.
export const dynamic = 'force-dynamic';

// --- Local row interfaces (DB shapes for this page only) ---

interface TopicRow {
  id: string;
  slug: string;
  title: unknown;
  level: string;
  explanation: unknown;
  examples: unknown;
  sort_order: number;
}

interface LessonRow {
  id: string;
  title: unknown;
}

interface LinkRow {
  lesson_id: string;
}

// --- Defensive jsonb narrowing ---

const LEVELS: GrammarLevel[] = ["a1", "a2", "b1", "b2", "c1", "c2"];

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

function mapTopic(row: TopicRow): TopicNode {
  const examples = Array.isArray(row.examples) ? row.examples : [];
  return {
    key: `db-${row.id}`,
    id: row.id,
    slug: row.slug,
    title: asLocalized(row.title),
    level: LEVELS.includes(row.level as GrammarLevel) ? (row.level as GrammarLevel) : "a1",
    explanation: asLocalized(row.explanation),
    examplesJson: JSON.stringify(examples, null, 2),
    sortOrder: String(row.sort_order),
  };
}

function mapLesson(row: LessonRow): LessonOption {
  return { id: row.id, title: asLocalized(row.title) };
}

export default async function AdminGrammarTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;

  // Lessons are public-read content — fetched through the cookie-less client
  // so this page never depends on session cookies for the checklist data.
  const lessonsResponse = await createPublicClient()
    .from("lessons")
    .select("id,title")
    .order("sort_order");
  const lessons = (lessonsResponse.data ?? []) as LessonRow[];
  const lessonOptions = lessons.map(mapLesson);

  if (topicId === "new") {
    return (
      <GrammarEditor
        topic={blankTopicNode()}
        lessons={lessonOptions}
        linkedLessonIds={[]}
      />
    );
  }

  const supabase = await createClient();
  const [{ data: topicData }, { data: linkRows }] = await Promise.all([
    supabase.from("grammar_topics").select("*").eq("id", topicId).maybeSingle(),
    supabase.from("lesson_grammar").select("lesson_id").eq("topic_id", topicId),
  ]);

  const topicRow = topicData as TopicRow | null;
  if (!topicRow) notFound();

  const linkedLessonIds = ((linkRows ?? []) as LinkRow[]).map((link) => link.lesson_id);

  return (
    <GrammarEditor
      topic={mapTopic(topicRow)}
      lessons={lessonOptions}
      linkedLessonIds={linkedLessonIds}
    />
  );
}
