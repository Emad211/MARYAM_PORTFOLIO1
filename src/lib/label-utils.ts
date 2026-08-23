import type { ClassType, Language, PostCategory } from "./types";

export const POST_CATEGORY_LABELS: Record<PostCategory, Record<Language, string>> = {
  language: { en: "Language", de: "Sprache", fa: "زبان" },
  culture: { en: "Culture", de: "Kultur", fa: "فرهنگ" },
  tips: { en: "Tips", de: "Tipps", fa: "نکات" },
};

export const CLASS_TYPE_LABELS: Record<ClassType, Record<Language, string>> = {
  private: { en: "Private", de: "Privat", fa: "خصوصی" },
  group: { en: "Group", de: "Gruppe", fa: "گروهی" },
  workshop: { en: "Workshop", de: "Workshop", fa: "کارگاه" },
};

const INTL_LOCALES: Record<Language, string> = {
  en: "en-US",
  de: "de-DE",
  fa: "fa-IR",
};

/**
 * Locale-aware date. `fa-IR` yields the Jalali calendar with Persian digits,
 * which also fixes bidi ordering of day/month/year inside RTL text.
 */
export function formatLocalizedDate(date: string | Date, language: Language): string {
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat(INTL_LOCALES[language], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

export function formatLocalizedNumber(value: number, language: Language): string {
  return value.toLocaleString(INTL_LOCALES[language]);
}
