
"use client";

import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GrammarLevel, GrammarTopic } from "@/lib/types";

const LEVEL_ORDER: readonly GrammarLevel[] = ["a1", "a2", "b1", "b2", "c1", "c2"];

const content = {
  en: {
    title: "German Grammar Bank",
    description:
      "Clear explanations with real examples, organised from A1 to C2. Pick a topic and see how German fits together.",
    empty: "Grammar topics are being prepared — check back soon.",
  },
  de: {
    title: "Deutsche Grammatik",
    description:
      "Klare Erklärungen mit echten Beispielen, sortiert von A1 bis C2. Wählen Sie ein Thema und verstehen Sie, wie Deutsch funktioniert.",
    empty: "Grammatikthemen werden gerade vorbereitet — schauen Sie bald wieder vorbei.",
  },
  fa: {
    title: "بانک گرامر آلمانی",
    description:
      "توضیح‌های روشن با مثال‌های واقعی، مرتب‌شده از A1 تا C2. یک موضوع را انتخاب کنید و ببینید زبان آلمانی چگونه کار می‌کند.",
    empty: "موضوع‌های گرامر در حال آماده‌سازی هستند — به‌زودی برگردید.",
  },
};

interface GrammarIndexProps {
  topics: GrammarTopic[];
}

export function GrammarIndex({ topics }: GrammarIndexProps) {
  const { language } = useLanguage();
  const t = content[language];

  const sections = LEVEL_ORDER.map((level) => ({
    level,
    items: topics.filter((topic) => topic.level === level),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 mx-auto max-w-3xl text-lg text-muted-foreground">
            {t.description}
          </p>
        </div>

        {sections.length === 0 ? (
          <p className="mt-16 text-center text-muted-foreground">{t.empty}</p>
        ) : (
          <div className="mt-16 space-y-16">
            {sections.map(({ level, items }) => (
              <section key={level}>
                <Badge variant="outline" className="font-headline tracking-widest">
                  {level.toUpperCase()}
                </Badge>
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((topic) => (
                    <Link key={topic.slug} href={`/grammar/${topic.slug}`} className="group">
                      <Card className="h-full transition-colors group-hover:border-primary">
                        <CardHeader>
                          <CardTitle className="font-headline text-lg">
                            {topic.title[language]}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {topic.explanation[language]}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
