
import { createClient } from "@/lib/supabase/server";
import { VocabBrowser, type VocabDeckListItem } from "@/components/admin/vocab-editor";
import type { LocalizedString } from "@/lib/types";

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

  const rows = (deckData ?? []) as DeckRow[];
  const cards = (cardData ?? []) as CardRow[];

  // Grouped counts: cards per deck.
  const cardCounts = countBy(cards, (c) => c.deck_id);

  const decks: VocabDeckListItem[] = rows.map((deck) => ({
    id: deck.id,
    title: asLocalized(deck.title),
    domain: deck.domain as VocabDeckListItem["domain"],
    isActive: deck.is_active,
    cardCount: cardCounts.get(deck.id) ?? 0,
  }));

  return <VocabBrowser decks={decks} />;
}
