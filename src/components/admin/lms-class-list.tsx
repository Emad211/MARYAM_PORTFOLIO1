"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/admin/empty-state";
import { useLanguage } from "@/context/language-context";
import type { Class } from "@/lib/types";

const content = {
  en: {
    title: "LMS Content",
    subtitle:
      "Pick a class to manage its curriculum — modules, lessons and questions.",
    manage: "Manage",
    empty: "No classes yet",
    emptySub: "Curriculum content is organized per class — create a class first.",
    emptyCta: "Create class",
  },
  de: {
    title: "LMS-Inhalte",
    subtitle:
      "Wählen Sie einen Kurs, um dessen Lehrplan zu verwalten — Module, Lektionen und Fragen.",
    manage: "Verwalten",
    empty: "Noch keine Kurse",
    emptySub:
      "Lehrplaninhalte sind pro Kurs organisiert — legen Sie zuerst einen Kurs an.",
    emptyCta: "Kurs anlegen",
  },
  fa: {
    title: "لیست کلاس‌ها",
    subtitle: "انتخاب کلاس برای مدیریت سرفصل‌ها (ماژول‌ها، درس‌ها و پرسش‌ها)",
    manage: "مدیریت",
    empty: "هنوز کلاسی ساخته نشده است",
    emptySub: "محتوای آموزشی برای هر کلاس جداگانه ساختار می‌یابد — ابتدا یک کلاس بسازید.",
    emptyCta: "ایجاد کلاس",
  },
} as const;

/** Class picker shown at /admin/lms — the entry point into the curriculum editor. */
export function LmsClassList({ classes }: { classes: Class[] }) {
  const { language } = useLanguage();
  const t = content[language];

  const titleFor = (cls: Class) =>
    cls.title[language] || cls.title.fa || cls.title.en;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          en={content.en.empty}
          de={content.de.empty}
          fa={content.fa.empty}
          subEn={content.en.emptySub}
          subDe={content.de.emptySub}
          subFa={content.fa.emptySub}
          action={{
            href: "/admin/classes/new",
            labelEn: content.en.emptyCta,
            labelDe: content.de.emptyCta,
            labelFa: content.fa.emptyCta,
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {classes.map((cls) => (
            <Card key={cls.slug} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{titleFor(cls)}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="outline">{cls.slug}</Badge>
                  <Badge variant="secondary">{cls.level}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex justify-end">
                <Button asChild size="sm">
                  <Link href={`/admin/lms/${cls.slug}`}>
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
