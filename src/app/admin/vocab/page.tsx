
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VocabDeckCreateForm } from "@/components/admin/vocab-editor";
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

interface DeckRow {
  id: string;
  title: unknown;
  domain: string;
  is_active: boolean;
}

interface CardRow {
  deck_id: string;
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

export default async function AdminVocabPage() {
  const supabase = await createClient();
  const [{ data: deckData }, { data: cardData }] = await Promise.all([
    supabase
      .from("vocab_decks")
      .select("id,title,domain,is_active")
      .order("sort_order")
      .order("created_at"),
    supabase.from("vocab_cards").select("deck_id"),
  ]);

  const decks = (deckData ?? []) as DeckRow[];
  const cards = (cardData ?? []) as CardRow[];

  // Grouped counts: cards per deck.
  const cardCounts = countBy(cards, (c) => c.deck_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vocabulary</h1>
        <p className="text-muted-foreground">
          Author the spaced-repetition decks and their flashcards.
        </p>
      </div>

      <VocabDeckCreateForm />

      {decks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No vocabulary decks yet. Create the first one above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {decks.map((deck) => {
            const title = asLocalized(deck.title);
            return (
              <Card key={deck.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span
                      aria-label={deck.is_active ? "Active" : "Inactive"}
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        deck.is_active ? "bg-emerald-500" : "bg-muted-foreground/40"
                      }`}
                    />
                    {title.en || title.fa}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline">{deck.domain}</Badge>
                    <span>{cardCounts.get(deck.id) ?? 0} cards</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex justify-end">
                  <Button asChild size="sm">
                    <Link href={`/admin/vocab/${deck.id}`}>
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
