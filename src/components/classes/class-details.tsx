
"use client";

import Image from "next/image";
import { notFound } from "next/navigation";
import { useLanguage } from "@/context/language-context";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Users, Clock } from "lucide-react";
import { RegistrationForm } from "@/components/classes/registration-form";
import type { Class } from "@/lib/types";

const content = {
  en: {
    objectives: "Course Objectives",
    prerequisites: "Prerequisites",
    schedule: "Schedule & Details",
    students: "Max Students",
    price: "Price",
    currency: "Toman",
    status: {
        active: "Active",
        full: "Class Full",
        inactive: "Not Available"
    }
  },
  de: {
    objectives: "Kursziele",
    prerequisites: "Voraussetzungen",
    schedule: "Zeitplan & Details",
    students: "Max. Teilnehmer",
    price: "Preis",
    currency: "Toman",
     status: {
        active: "Aktiv",
        full: "Kurs voll",
        inactive: "Nicht verfügbar"
    }
  },
  fa: {
    objectives: "اهداف دوره",
    prerequisites: "پیش‌نیازها",
    schedule: "برنامه و جزئیات",
    students: "حداکثر نفرات",
    price: "قیمت",
    currency: "تومان",
     status: {
        active: "فعال",
        full: "ظرفیت تکمیل",
        inactive: "ناموجود"
    }
  },
};

const statusMap = {
  active: {
    variant: "default" as const
  },
  full: {
    variant: "destructive" as const
  },
  inactive: {
    variant: "secondary" as const
  }
}

interface ClassDetailsProps {
  classes: Class[];
  slug: string;
}

export function ClassDetails({ classes, slug }: ClassDetailsProps) {
  const { language } = useLanguage();

  if (!classes) {
    return <div>Loading...</div>;
  }

  const classInfo = classes.find((c) => c.slug === slug);

  if (!classInfo) {
    notFound();
  }

  return (
    <article className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <Badge variant="secondary" className="mr-2">{classInfo.type}</Badge>
              <Badge variant="outline">{classInfo.level.toUpperCase()}</Badge>
              <h1 className="mt-4 font-headline text-4xl font-bold md:text-5xl">
                {classInfo.title[language]}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                {classInfo.excerpt[language]}
              </p>
            </div>
            
            <div className="relative my-8 aspect-video">
              <Image
                src={classInfo.imageUrl}
                alt={classInfo.title[language]}
                fill
                className="rounded-lg object-cover"
                data-ai-hint={classInfo.imageHint}
              />
            </div>
            
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: classInfo.description[language].replace(/\n/g, '<br />') }} />

              <h2 className="font-headline">{content[language].objectives}</h2>
              <ul className="pl-0">
                {classInfo.objectives.map((obj, index) => (
                  <li key={index} className="flex items-start rtl:mr-4 ltr:ml-0">
                    <CheckCircle2 className="mr-2 rtl:ml-2 mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <span>{obj[language]}</span>
                  </li>
                ))}
              </ul>

              <h2 className="font-headline">{content[language].prerequisites}</h2>
              <ul className="pl-0">
                {classInfo.prerequisites.map((req, index) => (
                  <li key={index} className="flex items-start rtl:mr-4 ltr:ml-0">
                    <CheckCircle2 className="mr-2 rtl:ml-2 mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <span>{req[language]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar with Registration */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-lg border bg-card p-6 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-headline text-2xl font-bold">{content[language].schedule}</h3>
                <Badge variant={statusMap[classInfo.status].variant} className="text-sm">
                    {content[language].status[classInfo.status]}
                </Badge>
              </div>

              {(classInfo.price || classInfo.price === 0) && (
                <div className="my-4 rounded-lg bg-muted p-4 text-center">
                    <p className="text-sm text-muted-foreground">{content[language].price}</p>
                    <p className="text-3xl font-bold text-primary">{classInfo.price.toLocaleString()} {content[language].currency}</p>
                </div>
              )}

              <div className="mt-4 space-y-3 text-card-foreground">
                 <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                        <p><strong>{classInfo.schedule.days[language]}</strong></p>
                        <p className="text-sm text-muted-foreground">{classInfo.schedule.time}</p>
                    </div>
                 </div>
                 {classInfo.maxStudents && (
                     <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <p>{classInfo.maxStudents} {content[language].students}</p>
                    </div>
                 )}
              </div>
              <hr className="my-6" />
              {classInfo.status === 'active' && <RegistrationForm classInfo={classInfo} />}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
