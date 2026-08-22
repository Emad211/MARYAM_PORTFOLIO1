import type { Language, LocalizedString } from './types';

export const CMS_LANGUAGES: Language[] = ['en', 'de', 'fa'];

function isComplete(values: readonly string[]): boolean {
  return values.every((value) => value.trim().length > 0);
}

export function findIncompleteLanguages(
  title: LocalizedString,
  excerpt: LocalizedString,
  body: LocalizedString,
): Language[] {
  return CMS_LANGUAGES.filter(
    (lang) => !isComplete([title[lang] ?? '', excerpt[lang] ?? '', body[lang] ?? '']),
  );
}

export function hasCompleteLanguage(
  title: LocalizedString,
  excerpt: LocalizedString,
  body: LocalizedString,
): boolean {
  return findIncompleteLanguages(title, excerpt, body).length < CMS_LANGUAGES.length;
}

