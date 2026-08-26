
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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

  const topics = (topicData ?? []) as TopicRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grammar Bank</h1>
          <p className="text-muted-foreground">
            Author the public grammar topics and link them to LMS lessons.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/grammar/new">
            <Plus className="me-1 h-4 w-4" />
            New topic
          </Link>
        </Button>
      </div>

      {topics.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No grammar topics yet. Create the first one above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => {
            const title = asLocalized(topic.title);
            return (
              <Card key={topic.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{title.en || title.fa}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline">/grammar/{topic.slug}</Badge>
                    <Badge variant="secondary">{topic.level.toUpperCase()}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex justify-end">
                  <Button asChild size="sm">
                    <Link href={`/admin/grammar/${topic.id}`}>
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
