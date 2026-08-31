"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";

export interface EmptyStateAction {
  href: string;
  labelEn: string;
  labelDe: string;
  labelFa: string;
}

interface EmptyStateProps {
  icon: LucideIcon;
  /** One-line title per UI language. */
  en: string;
  de: string;
  fa: string;
  /** Optional one-line description per UI language. */
  subEn?: string;
  subDe?: string;
  subFa?: string;
  /** Optional CTA link, rendered as a button (e.g. a create-action). */
  action?: EmptyStateAction;
}

/**
 * Shared trilingual empty state for admin pages: centered muted icon,
 * title, one-line description and an optional CTA link.
 */
export function EmptyState({
  icon: Icon,
  en,
  de,
  fa,
  subEn,
  subDe,
  subFa,
  action,
}: EmptyStateProps) {
  const { language } = useLanguage();

  const title = language === "en" ? en : language === "de" ? de : fa;
  const sub = language === "en" ? subEn : language === "de" ? subDe : subFa;
  const actionLabel =
    action === undefined
      ? ""
      : language === "en"
        ? action.labelEn
        : language === "de"
          ? action.labelDe
          : action.labelFa;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="max-w-md space-y-1">
          <p className="font-medium">{title}</p>
          {sub !== undefined && sub !== "" && (
            <p className="text-sm leading-relaxed text-muted-foreground">{sub}</p>
          )}
        </div>
        {action !== undefined && (
          <Button asChild size="sm">
            <Link href={action.href}>{actionLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
