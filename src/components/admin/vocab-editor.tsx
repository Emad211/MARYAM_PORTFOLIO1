"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronDown, Layers, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Language, LocalizedString } from "@/lib/types";
import { useLanguage } from "@/context/language-context";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  deleteVocabCard,
  deleteVocabDeck,
  upsertVocabCard,
  upsertVocabDeck,
  type ActionResult,
} from "@/app/actions/vocab-admin-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
const WORD_TYPES: CardWordType[] = ["noun", "verb", "adjective", "phrase", "other"];

// --- Trilingual UI strings (Persian-first, German in Sie-form) ---

const ui = {
  en: {
    browserTitle: "Vocabulary",
    browserSubtitle: "Author the spaced-repetition decks and their flashcards.",
    manage: "Manage",
    activeAria: "Active",
    inactiveAria: "Inactive",
    cardsCount: (n: number) => `${n} cards`,
    empty: "No vocabulary decks yet",
    emptySub: "Create the first one with the form above.",
    heading: "Vocabulary deck",
    subtitle: "Edit the deck header and its flashcards. Save the deck before adding cards.",
    save: "Save",
    delete: "Delete",
    remove: "Remove",
    unsaved: "unsaved",
    savedToast: "Saved.",
    deletedToast: "deleted.",
    actionFailed: "Action failed",
    failures: {
      unauthorized: "Your session is not authorized for this change.",
      invalid_input:
        "Check the fields: Persian text is required and the German front must be 1–200 characters.",
      save_failed: "The server could not save this item (check that the class slug exists).",
      delete_failed: "The server could not delete this item.",
    } as Record<string, string>,
    newDeck: "New deck",
    nounDeck: "Deck",
    confirmDeleteDeck: "Delete this deck with all its cards?",
    title: "Title",
    description: "Description (optional)",
    domain: "Domain",
    domainLabels: {
      alltag: "Alltag (Everyday)",
      studium: "Studium (Studies)",
      umwelt: "Umwelt (Environment)",
      arbeit_wirtschaft: "Arbeit & Wirtschaft (Work & Economy)",
      medien: "Medien (Media)",
      gesellschaft: "Gesellschaft (Society)",
    } as Record<VocabDomain, string>,
    classSlugLabel: "Class slug (optional link)",
    active: "Active",
    cardsLabel: "Cards",
    addCard: "Add card",
    saveDeckFirst: "Save the deck first",
    noCards: "No cards yet.",
    newCard: "New card",
    noHint: "no hint",
    nounCard: "Card",
    confirmDeleteCard: "Delete this card?",
    saveCard: "Save card",
    frontDe: "Front (German, 1–200 chars)",
    wordType: "Word type",
    wordTypeLabels: {
      noun: "Noun",
      verb: "Verb",
      adjective: "Adjective",
      phrase: "Phrase",
      other: "Other",
    } as Record<CardWordType, string>,
    sortOrder: "Sort order",
    hint: "Hint (optional)",
    exampleDe: "Example DE (optional)",
    exampleEn: "Example EN (optional)",
    exampleFa: "Example FA (optional)",
    newDeckForm: "New vocabulary deck",
    createDeck: "Create deck",
  },
  de: {
    browserTitle: "Wortschatz",
    browserSubtitle: "Erstellen Sie die Decks für verteiltes Wiederholen und deren Karten.",
    manage: "Verwalten",
    activeAria: "Aktiv",
    inactiveAria: "Inaktiv",
    cardsCount: (n: number) => `${n} Karten`,
    empty: "Noch keine Wortschatz-Decks",
    emptySub: "Legen Sie das erste mit dem Formular oben an.",
    heading: "Wortschatz-Deck",
    subtitle:
      "Bearbeiten Sie den Deck-Kopf und seine Karten. Speichern Sie das Deck, bevor Sie Karten hinzufügen.",
    save: "Speichern",
    delete: "Löschen",
    remove: "Entfernen",
    unsaved: "ungespeichert",
    savedToast: "Gespeichert.",
    deletedToast: "gelöscht.",
    actionFailed: "Aktion fehlgeschlagen",
    failures: {
      unauthorized: "Ihre Sitzung ist für diese Änderung nicht berechtigt.",
      invalid_input:
        "Bitte prüfen Sie die Felder: Persischer Text ist erforderlich und die deutsche Vorderseite muss 1–200 Zeichen lang sein.",
      save_failed:
        "Der Server konnte dieses Element nicht speichern (prüfen Sie, ob der Kurs-Slug existiert).",
      delete_failed: "Der Server konnte dieses Element nicht löschen.",
    } as Record<string, string>,
    newDeck: "Neues Deck",
    nounDeck: "Deck",
    confirmDeleteDeck: "Dieses Deck samt aller Karten löschen?",
    title: "Titel",
    description: "Beschreibung (optional)",
    domain: "Bereich",
    domainLabels: {
      alltag: "Alltag",
      studium: "Studium",
      umwelt: "Umwelt",
      arbeit_wirtschaft: "Arbeit & Wirtschaft",
      medien: "Medien",
      gesellschaft: "Gesellschaft",
    } as Record<VocabDomain, string>,
    classSlugLabel: "Kurs-Slug (optionale Verknüpfung)",
    active: "Aktiv",
    cardsLabel: "Karten",
    addCard: "Karte hinzufügen",
    saveDeckFirst: "Speichern Sie zuerst das Deck",
    noCards: "Noch keine Karten.",
    newCard: "Neue Karte",
    noHint: "kein Hinweis",
    nounCard: "Karte",
    confirmDeleteCard: "Diese Karte löschen?",
    saveCard: "Karte speichern",
    frontDe: "Vorderseite (Deutsch, 1–200 Zeichen)",
    wordType: "Wortart",
    wordTypeLabels: {
      noun: "Substantiv",
      verb: "Verb",
      adjective: "Adjektiv",
      phrase: "Redewendung",
      other: "Sonstige",
    } as Record<CardWordType, string>,
    sortOrder: "Reihenfolge",
    hint: "Hinweis (optional)",
    exampleDe: "Beispiel DE (optional)",
    exampleEn: "Beispiel EN (optional)",
    exampleFa: "Beispiel FA (optional)",
    newDeckForm: "Neues Wortschatz-Deck",
    createDeck: "Deck anlegen",
  },
  fa: {
    browserTitle: "واژگان",
    browserSubtitle: "طراحی دسته‌های مرور با فاصله و کارت‌های واژهٔ آنها.",
    manage: "مدیریت",
    activeAria: "فعال",
    inactiveAria: "غیرفعال",
    cardsCount: (n: number) => `${n} کارت`,
    empty: "هنوز دسته واژگانی ساخته نشده است",
    emptySub: "اولین دسته را با فرم بالا بسازید.",
    heading: "دسته واژگان",
    subtitle: "عنوان دسته و کارت‌های آن را ویرایش کنید. پیش از افزودن کارت، ابتدا دسته را ذخیره کنید.",
    save: "ذخیره",
    delete: "حذف",
    remove: "حذف",
    unsaved: "ذخیره‌نشده",
    savedToast: "ذخیره شد.",
    deletedToast: "حذف شد.",
    actionFailed: "انجام عملیات ناموفق بود",
    failures: {
      unauthorized: "اجازهٔ انجام این تغییر را ندارید.",
      invalid_input:
        "فیلدها را بررسی کنید: متن فارسی الزامی است و واژهٔ آلمانی باید ۱ تا ۲۰۰ نویسه باشد.",
      save_failed: "سرور نتوانست این مورد را ذخیره کند (وجود شناسهٔ کلاس را بررسی کنید).",
      delete_failed: "سرور نتوانست این مورد را حذف کند.",
    } as Record<string, string>,
    newDeck: "دسته جدید",
    nounDeck: "دسته",
    confirmDeleteDeck: "این دسته همراه با همه کارت‌هایش حذف شود؟",
    title: "عنوان",
    description: "توضیحات (اختیاری)",
    domain: "حوزه",
    domainLabels: {
      alltag: "Alltag (زندگی روزمره)",
      studium: "Studium (تحصیل)",
      umwelt: "Umwelt (محیط زیست)",
      arbeit_wirtschaft: "Arbeit & Wirtschaft (کار و اقتصاد)",
      medien: "Medien (رسانه)",
      gesellschaft: "Gesellschaft (جامعه)",
    } as Record<VocabDomain, string>,
    classSlugLabel: "کلاس مرتبط (اختیاری)",
    active: "فعال",
    cardsLabel: "کارت‌ها",
    addCard: "افزودن کارت",
    saveDeckFirst: "ابتدا دسته را ذخیره کنید",
    noCards: "هنوز کارتی افزوده نشده است.",
    newCard: "کارت جدید",
    noHint: "بدون راهنما",
    nounCard: "کارت",
    confirmDeleteCard: "این کارت حذف شود؟",
    saveCard: "ذخیره کارت",
    frontDe: "واژه آلمانی (۱ تا ۲۰۰ نویسه)",
    wordType: "نوع واژه",
    wordTypeLabels: {
      noun: "اسم",
      verb: "فعل",
      adjective: "صفت",
      phrase: "عبارت",
      other: "سایر",
    } as Record<CardWordType, string>,
    sortOrder: "ترتیب",
    hint: "راهنما (اختیاری)",
    exampleDe: "مثال آلمانی (اختیاری)",
    exampleEn: "مثال انگلیسی (اختیاری)",
    exampleFa: "مثال فارسی (اختیاری)",
    newDeckForm: "دسته واژگان جدید",
    createDeck: "ایجاد دسته",
  },
} as const;

type UiContent = (typeof ui)[keyof typeof ui];

function reportResult(
  toast: ReturnType<typeof useToast>["toast"],
  result: ActionResult,
  t: UiContent,
  deletedNoun?: string
): void {
  if (result.success) {
    toast({
      title:
        result.message === "deleted"
          ? `${deletedNoun ?? ""} ${t.deletedToast}`.trim()
          : t.savedToast,
    });
    return;
  }
  toast({
    variant: "destructive",
    title: t.actionFailed,
    description: t.failures[result.message] ?? result.message,
  });
}

function emptyLocalized(): LocalizedString {
  return { en: "", de: "", fa: "" };
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
  const { language } = useLanguage();
  return (
    <span className="ms-2 inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {ui[language].wordTypeLabels[wordType]}
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
  const { language } = useLanguage();
  const t = ui[language];
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
        reportResult(toast, result, t);
        if (result.success) {
          if (result.id && !deckNode.id) onPatch({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!deckNode.id || !window.confirm(t.confirmDeleteDeck)) return;
    const fd = new FormData();
    fd.set("id", deckNode.id);

    startTransition(() => {
      void (async () => {
        const result = await deleteVocabDeck(fd);
        reportResult(toast, result, t, t.nounDeck);
        if (result.success) router.push("/admin/vocab");
      })();
    });
  };

  return (
    <Card className="border-2">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <CardTitle className="text-base">
          {deckNode.title.fa || deckNode.title.en || t.newDeck}
          {!deckNode.id && (
            <span className="ms-2 align-middle text-xs font-normal text-muted-foreground">{t.unsaved}</span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            {t.save}
          </Button>
          {deckNode.id ? (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="me-1 h-4 w-4" />
              {t.delete}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <LangInputs
          idPrefix={`deck-${deckNode.key}-title`}
          label={t.title}
          value={deckNode.title}
          onChange={(title) => onPatch({ title })}
        />
        <LangInputs
          idPrefix={`deck-${deckNode.key}-description`}
          label={t.description}
          value={deckNode.description}
          onChange={(description) => onPatch({ description })}
        />

        <div className="grid gap-4 sm:grid-cols-[260px_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor={`deck-${deckNode.key}-domain`}>{t.domain}</Label>
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
                    {t.domainLabels[domain]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`deck-${deckNode.key}-class`}>{t.classSlugLabel}</Label>
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
            <Label htmlFor={`deck-${deckNode.key}-active`}>{t.active}</Label>
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
  const { language } = useLanguage();
  const t = ui[language];
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
        reportResult(toast, result, t);
        if (result.success) {
          if (result.id && !card.id) onPatch({ id: result.id });
          router.refresh();
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!card.id || !window.confirm(t.confirmDeleteCard)) return;
    const fd = new FormData();
    fd.set("id", card.id);

    startTransition(() => {
      void (async () => {
        const result = await deleteVocabCard(fd);
        reportResult(toast, result, t, t.nounCard);
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
          {card.frontDe || t.newCard}
          <WordTypeChip wordType={card.wordType} />
        </>
      }
      subtitle={`${card.hint.fa || card.hint.en || t.noHint}${!card.id ? ` · ${t.unsaved}` : ""}`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            {t.saveCard}
          </Button>
          {card.id ? (
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="me-1 h-4 w-4" />
              {t.delete}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onRemove} disabled={isPending}>
              {t.remove}
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_220px_140px] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor={`card-${card.key}-front`}>{t.frontDe}</Label>
            <Input
              id={`card-${card.key}-front`}
              lang="de"
              maxLength={200}
              value={card.frontDe}
              onChange={(e) => onPatch({ frontDe: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`card-${card.key}-type`}>{t.wordType}</Label>
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
                    {t.wordTypeLabels[wordType]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumberField
            id={`card-${card.key}-sort`}
            label={t.sortOrder}
            value={card.sortOrder}
            onChange={(sortOrder) => onPatch({ sortOrder })}
            min={0}
          />
        </div>

        <LangInputs
          idPrefix={`card-${card.key}-hint`}
          label={t.hint}
          value={card.hint}
          onChange={(hint) => onPatch({ hint })}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor={`card-${card.key}-exde`} className="text-xs text-muted-foreground">
              {t.exampleDe}
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
              {t.exampleEn}
            </Label>
            <Input
              id={`card-${card.key}-exen`}
              value={card.exampleEn}
              onChange={(e) => onPatch({ exampleEn: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`card-${card.key}-exfa`} className="text-xs text-muted-foreground">
              {t.exampleFa}
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
  const { language } = useLanguage();
  const t = ui[language];
  const [deck, setDeck] = useState<DeckNode>(initialDeck);
  const [cards, setCards] = useState<CardNode[]>(initialCards);

  const displayTitle = deck.title[language] || deck.title.fa || deck.title.en;

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t.heading} · {displayTitle}
        </h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      <DeckCard deckNode={deck} onPatch={patchDeck} />

      <div className="space-y-2 rounded-lg border border-dashed p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {t.cardsLabel} ({cards.length})
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={addCard}
            disabled={!deck.id}
            title={deck.id ? undefined : t.saveDeckFirst}
          >
            <Plus className="me-1 h-4 w-4" />
            {t.addCard}
          </Button>
        </div>
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noCards}</p>
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
  const { language } = useLanguage();
  const t = ui[language];
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
        reportResult(toast, result, t);
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
        <CardTitle className="text-base">{t.newDeckForm}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LangInputs idPrefix="new-deck-title" label={t.title} value={title} onChange={setTitle} />
        <LangInputs
          idPrefix="new-deck-description"
          label={t.description}
          value={description}
          onChange={setDescription}
        />

        <div className="grid gap-4 sm:grid-cols-[260px_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="new-deck-domain">{t.domain}</Label>
            <Select value={domain} onValueChange={(value) => setDomain(value as VocabDomain)}>
              <SelectTrigger id="new-deck-domain">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOMAINS.map((domainOption) => (
                  <SelectItem key={domainOption} value={domainOption}>
                    {t.domainLabels[domainOption]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-deck-class">{t.classSlugLabel}</Label>
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
            <Label htmlFor="new-deck-active">{t.active}</Label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Save className="me-1 h-4 w-4" />}
            {t.createDeck}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Vocab list page body (heading + create form + grid) ---

export interface VocabDeckListItem {
  id: string;
  title: LocalizedString;
  domain: VocabDomain;
  isActive: boolean;
  cardCount: number;
}

export function VocabBrowser({ decks }: { decks: VocabDeckListItem[] }) {
  const { language } = useLanguage();
  const t = ui[language];

  const titleFor = (deck: VocabDeckListItem) =>
    deck.title[language] || deck.title.fa || deck.title.en;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.browserTitle}</h1>
        <p className="text-muted-foreground">{t.browserSubtitle}</p>
      </div>

      <VocabDeckCreateForm />

      {decks.length === 0 ? (
        <EmptyState
          icon={Layers}
          en={ui.en.empty}
          de={ui.de.empty}
          fa={ui.fa.empty}
          subEn={ui.en.emptySub}
          subDe={ui.de.emptySub}
          subFa={ui.fa.emptySub}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {decks.map((deck) => (
            <Card key={deck.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span
                    aria-label={deck.isActive ? t.activeAria : t.inactiveAria}
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      deck.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
                    }`}
                  />
                  {titleFor(deck)}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="outline">{t.domainLabels[deck.domain]}</Badge>
                  <span>{t.cardsCount(deck.cardCount)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex justify-end">
                <Button asChild size="sm">
                  <Link href={`/admin/vocab/${deck.id}`}>
                    {t.manage}
                    <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
