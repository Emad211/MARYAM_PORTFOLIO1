
"use client";

import Image from "next/image";
import { Timeline } from "@/components/about/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import type { AboutContent as AboutContentType, TimelineEvent } from "@/lib/types";

// Content for the component, extracted for clarity
const contentText = {
  en: {
    loading: "Loading...",
  },
  de: {
    loading: "Wird geladen...",
  },
  fa: {
    loading: "در حال بارگذاری...",
  },
};

interface AboutContentProps {
  aboutContent: AboutContentType;
  timeline: TimelineEvent[];
}

// This is now the Client Component that displays the data
export function AboutContent({ aboutContent, timeline }: AboutContentProps) {
  const { language } = useLanguage();

  if (!aboutContent || !timeline) {
    return <div>{contentText[language].loading}</div>;
  }

  const content = aboutContent;

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-6">
        {/* Story Section */}
        <section className="mb-24">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">
                {content.title[language]}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                {content.story[language]}
              </p>
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <Image
                src="/teacher.jpg"
                alt="Educator portrait"
                width={500}
                height={500}
                className="rounded-full object-cover shadow-lg aspect-square"
                data-ai-hint="educator portrait"
              />
            </div>
          </div>
        </section>

        {/* Qualifications Section */}
        <section className="mb-24 rounded-lg bg-secondary p-8 md:p-12">
            <h2 className="text-center font-headline text-3xl font-bold md:text-4xl">{content.qualificationsTitle[language]}</h2>
            <div className="mt-8 mx-auto max-w-2xl">
                 <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 bg-background p-6">
                        <Award className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle className="font-headline text-2xl">{content.testdafTitle[language]}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <p className="text-muted-foreground text-center">{content.testdafDescription[language]}</p>
                    </CardContent>
                </Card>
            </div>
        </section>

        {/* Timeline Section */}
        <section>
          <h2 className="text-center font-headline text-3xl font-bold md:text-4xl">
            {content.timelineTitle[language]}
          </h2>
          <Timeline timelineEvents={timeline} />
        </section>
      </div>
    </div>
  );
}
