
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  VocabEditor,
  type CardNode,
  type CardWordType,
  type DeckNode,
  type VocabDomain,
} from "@/components/admin/vocab-editor";
import type { LocalizedString } from "@/lib/types";

// The editor must reflect live DB state (admin RLS read through the
// request-bound client), never a build-time snapshot.
export const dynamic = 'force-dynamic';

// --- Local row interfaces (DB shapes for this page only) ---

interface DeckRow {
  id: string;
  title: unknown;
  description: unknown;
  domain: string;
  class_slug: string | null;
  is_active: boolean;
}

interface CardRow {
  id: string;
  deck_id: string;
  front_de: string;
  word_type: string;
  hint: unknown;
  example_de: string | null;
  example_en: string | null;
  example_fa: string | null;
  sort_order: number;
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

const DOMAINS: VocabDomain[] = [
  "alltag",
  "studium",
  "umwelt",
  "arbeit_wirtschaft",
  "medien",
  "gesellschaft",
];
const WORD_TYPES: CardWordType[] = ["noun", "verb", "adjective", "phrase", "other"];

// --- Row → editor-node mapping ---

function mapDeck(row: DeckRow): DeckNode {
  return {
    key: `db-${row.id}`,
    id: row.id,
    title: asLocalized(row.title),
    description:
      row.description === null ? { en: "", de: "", fa: "" } : asLocalized(row.description),
    domain: DOMAINS.includes(row.domain as VocabDomain) ? (row.domain as VocabDomain) : "alltag",
    classSlug: row.class_slug ?? "",
    isActive: row.is_active,
  };
}

function mapCard(row: CardRow): CardNode {
  return {
    key: `db-${row.id}`,
    id: row.id,
    deckId: row.deck_id,
    frontDe: row.front_de,
    wordType: WORD_TYPES.includes(row.word_type as CardWordType)
      ? (row.word_type as CardWordType)
      : "other",
    hint: row.hint === null ? { en: "", de: "", fa: "" } : asLocalized(row.hint),
    exampleDe: row.example_de ?? "",
    exampleEn: row.example_en ?? "",
    exampleFa: row.example_fa ?? "",
    sortOrder: String(row.sort_order),
  };
}

export default async function AdminVocabDeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;

  const supabase = await createClient();
  const [{ data: deckData }, { data: cardRows }] = await Promise.all([
    supabase.from("vocab_decks").select("*").eq("id", deckId).maybeSingle(),
    supabase.from("vocab_cards").select("*").eq("deck_id", deckId).order("sort_order"),
  ]);

  const deckRow = deckData as DeckRow | null;
  if (!deckRow) notFound();

  const deck = mapDeck(deckRow);
  const cards = ((cardRows ?? []) as CardRow[]).map(mapCard);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Vocabulary deck · {deck.title.en || deck.title.fa}
        </h1>
        <p className="text-muted-foreground">
          Edit the deck header and its flashcards. Save the deck before adding cards.
        </p>
      </div>
      <VocabEditor deck={deck} cards={cards} />
    </div>
  );
}
