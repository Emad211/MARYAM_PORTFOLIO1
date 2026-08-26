"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Language, LocalizedString } from "@/lib/types";
import {
  deleteVocabCard,
  deleteVocabDeck,
  upsertVocabCard,
  upsertVocabDeck,
  type ActionResult,
} from "@/app/actions/vocab-admin-actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// --- Editor-side tree types (mapped from DB rows by the server page) ---

export type VocabDomain =
  | "alltag"
  | "studium"
  | "umwelt"
  | "arbeit_wirtschaft"
  | "medien"
  | "gesellschaft";
export type CardWordType = "noun" | "verb" | "adjective" | "phrase" | "other";

export interface DeckNode {
  key: string;
  id: string | null;
  title: LocalizedString;
  /** Empty strings when the deck has no description. */
  description: LocalizedString;
  domain: VocabDomain;
  classSlug: string;
  isActive: boolean;
}

export interface CardNode {
  key: string;
  id: string | null;
  deckId: string | null;
  frontDe: string;
  wordType: CardWordType;
  /** Empty strings when the card has no hint. */
  hint: LocalizedString;
  exampleDe: string;
  exampleEn: string;
  exampleFa: string;
  sortOrder: string;
}

// --- Constants ---

const LANGS: Language[] = ["en", "de", "fa"];
const LANG_LABEL: Record<Language, string> = { en: "EN", de: "DE", fa: "FA" };
const DOMAINS: VocabDomain[] = [
  "alltag",
  "studium",
  "umwelt",
  "arbeit_wirtschaft",
  "medien",
  "gesellschaft",
];
const DOMAIN_LABEL: Record<VocabDomain, string> = {
  alltag: "Alltag (Everyday)",
  studium: "Studium (Studies)",
  umwelt: "Umwelt (Environment)",
  arbeit_wirtschaft: "Arbeit & Wirtschaft",
  medien: "Medien (Media)",
  gesellschaft: "Gesellschaft (Society)",
};
const WORD_TYPES: CardWordType[] = ["noun", "verb", "adjective", "phrase", "other"];
const WORD_TYPE_LABEL: Record<CardWordType, string> = {
  noun: "Noun",
  verb: "Verb",
  adjective: "Adjective",
  phrase: "Phrase",
  other: "Other",
};

function emptyLocalized(): LocalizedString {
  return { en: "", de: "", fa: "" };
}

// --- Result toast mapping ---

const FAILURE_DESCRIPTIONS: Record<string, string> = {
  unauthorized: "Your session is not authorized for this change.",
  invalid_input:
    "Check the fields: Persian text is required and the German front must be 1–200 characters.",
  save_failed: "The server could not save this item (check that the class slug exists).",
  delete_failed: "The server could not delete this item.",
};

function reportResult(
  toast: ReturnType<typeof useToast>["toast"],
  result: ActionResult,
  deletedNoun?: string
): void {
  if (result.success) {
    toast({ title: result.message === "deleted" ? `${deletedNoun ?? "Item"} deleted.` : "Saved." });
    return;
  }
  toast({
    variant: "destructive",
    title: "Action failed",
    description: FAILURE_DESCRIPTIONS[result.message] ?? result.message,
  });
}

// --- Small field atoms (copied verbatim-style from exam-editor) ---

interface LangFieldsProps {
  idPrefix: string;
  label: string;
  value: LocalizedString;
  onChange: (next: LocalizedString) => void;
}

function LangInputs({ idPrefix, label, value, onChange }: LangFieldsProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {LANGS.map((lang) => (
          <div key={lang} className="space-y-1">
            <Label htmlFor={`${idPrefix}-${lang}`} className="text-xs text-muted-foreground">
              {LANG_LABEL[lang]}
            </Label>
            <Input
              id={`${idPrefix}-${lang}`}
              dir={lang === "fa" ? "rtl" : "ltr"}
              value={value[lang]}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  min?: number;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28"
      />
    </div>
  );
}

function CollapsibleSection({
  open,
  onToggle,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-start hover:bg-muted/50"
      >
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
        <span className="flex-1 truncate">
          <span className="block text-sm font-bold">{title}</span>
          <span className="block text-xs text-muted-foreground">{subtitle}</span>
        </span>
      </button>
      {open && <div className="border-t p-4">{children}</div>}
    </div>
  );
}

function WordTypeChip({ wordType }: { wordType: CardWordType }) {
  return (
    <span className="ms-2 inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {WORD_TYPE_LABEL[wordType]}
    </span>
  );
}

// --- Blank factories ---

let blankCounter = 0;
function nextKey(prefix: string): string {
  blankCounter += 1;
  return `${prefix}-new-${blankCounter}`;
}

function blankCard(deckId: string | null): CardNode {
  return {
    key: nextKey("c"),
    id: null,
    deckId,
    frontDe: "",
    wordType: "noun",
    hint: emptyLocalized(),
    exampleDe: "",
    exampleEn: "",
    exampleFa: "",
    sortOrder: "0",
  };
}

// --- Deck card (top-level editable header) ---

interface DeckCardProps {
  deckNode: DeckNode;
  onPatch: (patch: Partial<DeckNode>) => void;
}

function DeckCard({ deckNode, onPatch }: DeckCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const fd = new FormData();
    if (deckNode.id) fd.set("id", deckNode.id);
    fd.set("titleEn", deckNode.title.en);
    fd.set("titleDe", deckNode.title.de);
    fd.set("titleFa", deckNode.title.fa);
    fd.set("descriptionEn", deckNode.description.en);
    fd.set("descriptionDe", deckNode.description.de);
    fd.set("descriptionFa", deckNode.description.fa);
    fd.set("domain", deckNode.domain);
    if (deckNode.classSlug.trim()) fd.set("classSlug", deckNode.classSlug.trim());
    if (deckNode.isActive) fd.set("isActive", "on");

    startTransition(() => {
      void (async () => {
        const result = await upsertVocabDeck(fd);
        reportResult(toast, result);
        if (result.success) {
          if (result.id && !deckNode.id) onPatch({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!deckNode.id || !window.confirm("Delete this deck with all its cards?")) return;
    const fd = new FormData();
    fd.set("id", deckNode.id);

    startTransition(() => {
      void (async () => {
        const result = await deleteVocabDeck(fd);
        reportResult(toast, result, "Deck");
        if (result.success) router.push("/admin/vocab");
      })();
    });
  };

  return (
    <Card className="border-2">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <CardTitle className="text-base">
          {deckNode.title.fa || deckNode.title.en || "New deck"}
          {!deckNode.id && (
            <span className="ms-2 align-middle text-xs font-normal text-muted-foreground">unsaved</span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            Save
          </Button>
          {deckNode.id ? (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="me-1 h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <LangInputs
          idPrefix={`deck-${deckNode.key}-title`}
          label="Title"
          value={deckNode.title}
          onChange={(title) => onPatch({ title })}
        />
        <LangInputs
          idPrefix={`deck-${deckNode.key}-description`}
          label="Description (optional)"
          value={deckNode.description}
          onChange={(description) => onPatch({ description })}
        />

        <div className="grid gap-4 sm:grid-cols-[260px_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor={`deck-${deckNode.key}-domain`}>Domain</Label>
            <Select
              value={deckNode.domain}
              onValueChange={(domain) => onPatch({ domain: domain as VocabDomain })}
            >
              <SelectTrigger id={`deck-${deckNode.key}-domain`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOMAINS.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {DOMAIN_LABEL[domain]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`deck-${deckNode.key}-class`}>Class slug (optional link)</Label>
            <Input
              id={`deck-${deckNode.key}-class`}
              placeholder="e.g. b1-intensiv"
              value={deckNode.classSlug}
              onChange={(e) => onPatch({ classSlug: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              id={`deck-${deckNode.key}-active`}
              checked={deckNode.isActive}
              onCheckedChange={(checked) => onPatch({ isActive: checked === true })}
            />
            <Label htmlFor={`deck-${deckNode.key}-active`}>Active</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Card row (accordion entry) ---

interface CardRowProps {
  card: CardNode;
  onPatch: (patch: Partial<CardNode>) => void;
  onRemove: () => void;
}

function CardRow({ card, onPatch, onRemove }: CardRowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const fd = new FormData();
    if (card.id) fd.set("id", card.id);
    if (card.deckId) fd.set("deckId", card.deckId);
    fd.set("frontDe", card.frontDe);
    fd.set("wordType", card.wordType);
    fd.set("hintEn", card.hint.en);
    fd.set("hintDe", card.hint.de);
    fd.set("hintFa", card.hint.fa);
    fd.set("exampleDe", card.exampleDe);
    fd.set("exampleEn", card.exampleEn);
    fd.set("exampleFa", card.exampleFa);
    fd.set("sortOrder", card.sortOrder.trim() === "" ? "0" : card.sortOrder);

    startTransition(() => {
      void (async () => {
        const result = await upsertVocabCard(fd);
        reportResult(toast, result);
        if (result.success) {
          if (result.id && !card.id) onPatch({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!card.id || !window.confirm("Delete this card?")) return;
    const fd = new FormData();
    fd.set("id", card.id);

    startTransition(() => {
      void (async () => {
        const result = await deleteVocabCard(fd);
        reportResult(toast, result, "Card");
        if (result.success) router.refresh();
      })();
    });
  };

  return (
    <CollapsibleSection
      open={open}
      onToggle={() => setOpen((v) => !v)}
      title={
        <>
          {card.frontDe || "New card"}
          <WordTypeChip wordType={card.wordType} />
        </>
      }
      subtitle={`${card.hint.fa || card.hint.en || "no hint"}${!card.id ? " · unsaved" : ""}`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            Save card
          </Button>
          {card.id ? (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="me-1 h-4 w-4" />
              Delete card
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onRemove} disabled={isPending}>
              Remove
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_220px_140px] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor={`card-${card.key}-front`}>Front (German, 1–200 chars)</Label>
            <Input
              id={`card-${card.key}-front`}
              lang="de"
              maxLength={200}
              value={card.frontDe}
              onChange={(e) => onPatch({ frontDe: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`card-${card.key}-type`}>Word type</Label>
            <Select
              value={card.wordType}
              onValueChange={(wordType) => onPatch({ wordType: wordType as CardWordType })}
            >
              <SelectTrigger id={`card-${card.key}-type`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORD_TYPES.map((wordType) => (
                  <SelectItem key={wordType} value={wordType}>
                    {WORD_TYPE_LABEL[wordType]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumberField
            id={`card-${card.key}-sort`}
            label="Sort order"
            value={card.sortOrder}
            onChange={(sortOrder) => onPatch({ sortOrder })}
            min={0}
          />
        </div>

        <LangInputs
          idPrefix={`card-${card.key}-hint`}
          label="Hint (optional)"
          value={card.hint}
          onChange={(hint) => onPatch({ hint })}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor={`card-${card.key}-exde`} className="text-xs text-muted-foreground">
              Example DE (optional)
            </Label>
            <Input
              id={`card-${card.key}-exde`}
              lang="de"
              value={card.exampleDe}
              onChange={(e) => onPatch({ exampleDe: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`card-${card.key}-exen`} className="text-xs text-muted-foreground">
              Example EN (optional)
            </Label>
            <Input
              id={`card-${card.key}-exen`}
              value={card.exampleEn}
              onChange={(e) => onPatch({ exampleEn: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`card-${card.key}-exfa`} className="text-xs text-muted-foreground">
              Example FA (optional)
            </Label>
            <Input
              id={`card-${card.key}-exfa`}
              dir="rtl"
              value={card.exampleFa}
              onChange={(e) => onPatch({ exampleFa: e.target.value })}
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

// --- Root editor ---

export function VocabEditor({
  deck: initialDeck,
  cards: initialCards,
}: {
  deck: DeckNode;
  cards: CardNode[];
}) {
  const [deck, setDeck] = useState<DeckNode>(initialDeck);
  const [cards, setCards] = useState<CardNode[]>(initialCards);

  const patchDeck = useCallback((patch: Partial<DeckNode>) => {
    setDeck((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchCard = useCallback((key: string, patch: Partial<CardNode>) => {
    setCards((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }, []);

  const addCard = () => setCards((prev) => [...prev, blankCard(deck.id)]);
  const removeCard = (key: string) => setCards((prev) => prev.filter((c) => c.key !== key));

  return (
    <div className="space-y-6">
      <DeckCard deckNode={deck} onPatch={patchDeck} />

      <div className="space-y-2 rounded-lg border border-dashed p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Cards ({cards.length})</div>
          <Button
            size="sm"
            variant="outline"
            onClick={addCard}
            disabled={!deck.id}
            title={deck.id ? undefined : "Save the deck first"}
          >
            <Plus className="me-1 h-4 w-4" />
            Add card
          </Button>
        </div>
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cards yet.</p>
        ) : (
          <div className="space-y-2">
            {cards.map((card) => (
              <CardRow
                key={card.key}
                card={card}
                onPatch={(patch) => patchCard(card.key, patch)}
                onRemove={() => removeCard(card.key)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- New-deck form (used by the deck list page) ---

export function VocabDeckCreateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState<LocalizedString>(emptyLocalized());
  const [description, setDescription] = useState<LocalizedString>(emptyLocalized());
  const [domain, setDomain] = useState<VocabDomain>("alltag");
  const [classSlug, setClassSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const fd = new FormData();
    fd.set("titleEn", title.en);
    fd.set("titleDe", title.de);
    fd.set("titleFa", title.fa);
    fd.set("descriptionEn", description.en);
    fd.set("descriptionDe", description.de);
    fd.set("descriptionFa", description.fa);
    fd.set("domain", domain);
    if (classSlug.trim()) fd.set("classSlug", classSlug.trim());
    if (isActive) fd.set("isActive", "on");

    startTransition(() => {
      void (async () => {
        const result = await upsertVocabDeck(fd);
        reportResult(toast, result);
        if (result.success) {
          setTitle(emptyLocalized());
          setDescription(emptyLocalized());
          setDomain("alltag");
          setClassSlug("");
          setIsActive(true);
          router.refresh();
        }
      })();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New vocabulary deck</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LangInputs idPrefix="new-deck-title" label="Title" value={title} onChange={setTitle} />
        <LangInputs
          idPrefix="new-deck-description"
          label="Description (optional)"
          value={description}
          onChange={setDescription}
        />

        <div className="grid gap-4 sm:grid-cols-[260px_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="new-deck-domain">Domain</Label>
            <Select value={domain} onValueChange={(value) => setDomain(value as VocabDomain)}>
              <SelectTrigger id="new-deck-domain">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOMAINS.map((domainOption) => (
                  <SelectItem key={domainOption} value={domainOption}>
                    {DOMAIN_LABEL[domainOption]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-deck-class">Class slug (optional link)</Label>
            <Input
              id="new-deck-class"
              placeholder="e.g. b1-intensiv"
              value={classSlug}
              onChange={(e) => setClassSlug(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              id="new-deck-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label htmlFor="new-deck-active">Active</Label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            Create deck
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
