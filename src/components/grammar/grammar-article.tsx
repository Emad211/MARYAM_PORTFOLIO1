
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GrammarTopic, LocalizedString } from "@/lib/types";

interface TopicLesson {
  id: string;
  title: LocalizedString;
  classSlug: string;
}

const content = {
  en: {
    back: "All grammar topics",
    examples: "Examples",
    relatedLessons: "Related Lessons",
    ctaTitle: "Want guided practice?",
    ctaDescription:
      "These topics come alive inside our classes — structured lessons, exercises and personal feedback.",
    ctaButton: "Explore Classes",
  },
  de: {
    back: "Alle Grammatikthemen",
    examples: "Beispiele",
    relatedLessons: "Passende Lektionen",
    ctaTitle: "Möchten Sie geführt üben?",
    ctaDescription:
      "Diese Themen werden in unseren Kursen lebendig — strukturierte Lektionen, Übungen und persönliches Feedback.",
    ctaButton: "Kurse entdecken",
  },
  fa: {
    back: "همه موضوع‌های گرامر",
    examples: "مثال‌ها",
    relatedLessons: "درس‌های مرتبط",
    ctaTitle: "می‌خواهید با راهنمایی تمرین کنید؟",
    ctaDescription:
      "این موضوع‌ها در کلاس‌های ما جان می‌گیرند — درس‌های ساخت‌یافته، تمرین و بازخورد شخصی.",
    ctaButton: "مشاهده کلاس‌ها",
  },
};

interface GrammarArticleProps {
  topic: GrammarTopic;
  lessons: TopicLesson[];
}

export function GrammarArticle({ topic, lessons }: GrammarArticleProps) {
  const { language } = useLanguage();
  const t = content[language];

  const paragraphs = topic.explanation[language]
    .split("\n\n")
    .filter((paragraph) => paragraph.trim().length > 0);

  return (
    <article className="py-16 md:py-24">
      <div className="container mx-auto max-w-4xl px-6">
        <Link
          href="/grammar"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t.back}
        </Link>

        <header className="mt-8 text-center">
          <Badge variant="outline" className="font-headline tracking-widest">
            {topic.level.toUpperCase()}
          </Badge>
          <h1 className="mt-4 font-headline text-4xl font-bold tracking-tight md:text-5xl">
            {topic.title[language]}
          </h1>
        </header>

        <div className="prose prose-lg dark:prose-invert mx-auto mt-10 max-w-3xl">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>

        {topic.examples.length > 0 && (
          <section className="mx-auto mt-12 max-w-3xl">
            <h2 className="font-headline text-2xl font-bold">{t.examples}</h2>
            <ul className="mt-6 space-y-4">
              {topic.examples.map((example, index) => (
                <li key={index} className="rounded-lg border bg-card p-4">
                  <p className="font-semibold">{example.de}</p>
                  <p className="mt-1 text-sm">{example.en}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{example.fa}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {lessons.length > 0 && (
          <section className="mx-auto mt-12 max-w-3xl">
            <h2 className="font-headline text-2xl font-bold">{t.relatedLessons}</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/classes/${lesson.classSlug}/lessons/${lesson.id}`}
                  className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                >
                  {lesson.title[language]}
                </Link>
              ))}
            </div>
          </section>
        )}

        <Card className="mx-auto mt-16 max-w-3xl bg-secondary">
          <CardHeader>
            <CardTitle className="font-headline text-xl">{t.ctaTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{t.ctaDescription}</p>
            <Button asChild>
              <Link href="/classes">{t.ctaButton}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
