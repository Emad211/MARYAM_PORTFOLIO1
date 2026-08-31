
import { createClient } from "@/lib/supabase/server";
import { GrammarTopicsBrowser } from "@/components/admin/grammar-editor";
import type { LocalizedString } from "@/lib/types";

// Admin lists must always render live data, never a build-time snapshot.
export const dynamic = 'force-dynamic';

// --- Local row interfaces (DB shapes for this page only) ---

interface TopicRow {
  id: string;
  slug: string;
  title: unknown;
  level: string;
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

export default async function AdminGrammarPage() {
  const supabase = await createClient();
  const { data: topicData } = await supabase
    .from("grammar_topics")
    .select("id,slug,title,level")
    .order("sort_order")
    .order("created_at");

  const topics = ((topicData ?? []) as TopicRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: asLocalized(row.title),
    level: row.level,
  }));

  return <GrammarTopicsBrowser topics={topics} />;
}
