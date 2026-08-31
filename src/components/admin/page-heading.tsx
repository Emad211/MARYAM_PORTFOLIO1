
"use client";

import { useLanguage } from "@/context/language-context";

interface AdminPageHeadingProps {
  en: string;
  de: string;
  fa: string;
  subEn?: string;
  subDe?: string;
  subFa?: string;
}

/**
 * Shared trilingual page heading for classic CMS admin pages. Titles and
 * optional subtitles are picked by the active language (Persian-first),
 * matching the sidebar/header dictionary pattern.
 */
export function AdminPageHeading({
  en,
  de,
  fa,
  subEn,
  subDe,
  subFa,
}: AdminPageHeadingProps) {
  const { language } = useLanguage();
  const title = { en, de, fa }[language];
  const subtitle = { en: subEn, de: subDe, fa: subFa }[language];

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-1 text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
