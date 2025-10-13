
"use client";

import { useState } from "react";
import { useLanguage } from "@/context/language-context";
import type { Class, ClassLevel, ClassType } from "@/lib/types";
import { ClassCard } from "@/components/classes/class-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const classesContent = {
  en: {
    title: "Our Language Courses",
    description: "Find the perfect class to match your learning style and goals. From personalized private lessons to dynamic group workshops, your journey to fluency starts here.",
    all: "All",
    private: "Private",
    group: "Group",
    workshop: "Workshop",
    filterLevel: "Filter by level...",
  },
  de: {
    title: "Unsere Sprachkurse",
    description: "Finden Sie den perfekten Kurs, der zu Ihrem Lernstil und Ihren Zielen passt. Von personalisierten Privatstunden bis hin zu dynamischen Gruppenworkshops beginnt Ihre Reise zur Sprachflüssigkeit hier.",
    all: "Alle",
    private: "Privat",
    group: "Gruppe",
    workshop: "Workshop",
    filterLevel: "Nach Niveau filtern...",
  },
  fa: {
    title: "کلاس‌های زبان ما",
    description: "کلاس مناسب با سبک یادگیری و اهداف خود را پیدا کنید. از درس‌های خصوصی شخصی‌سازی شده تا کارگاه‌های گروهی پویا، سفر شما به سوی روانی در زبان از اینجا آغاز می‌شود.",
    all: "همه",
    private: "خصوصی",
    group: "گروهی",
    workshop: "کارگاه",
    filterLevel: "فیلتر بر اساس سطح...",
  },
};

const levels: ClassLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];

export function ClassesPageContent({ classes }: { classes: Class[] }) {
  const { language } = useLanguage();
  const content = classesContent[language];
  
  const [activeType, setActiveType] = useState<ClassType | 'all'>('all');
  const [activeLevel, setActiveLevel] = useState<ClassLevel | 'all'>('all');

  const filteredClasses = classes.filter(c => {
    const typeMatch = activeType === 'all' || c.type === activeType;
    const levelMatch = activeLevel === 'all' || c.level === activeLevel;
    return typeMatch && levelMatch;
  });

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">
            {content.title}
          </h1>
          <p className="mt-4 mx-auto max-w-3xl text-lg text-muted-foreground">
            {content.description}
          </p>
        </div>

        <div className="my-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Tabs value={activeType} onValueChange={(value) => setActiveType(value as ClassType | 'all')}>
            <TabsList>
              <TabsTrigger value="all">{content.all}</TabsTrigger>
              <TabsTrigger value="private">{content.private}</TabsTrigger>
              <TabsTrigger value="group">{content.group}</TabsTrigger>
              <TabsTrigger value="workshop">{content.workshop}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={activeLevel} onValueChange={(value) => setActiveLevel(value as ClassLevel | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={content.filterLevel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{content.all}</SelectItem>
              {levels.map(level => (
                <SelectItem key={level} value={level}>{level.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((classInfo: Class) => (
            <ClassCard key={classInfo.slug} classInfo={classInfo} />
          ))}
        </div>
        {filteredClasses.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>No classes match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
