
"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import type { Class } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface ClassCardProps {
  classInfo: Class;
}

const cardContent = {
  en: {
    details: "View Details"
  },
  de: {
    details: "Details anzeigen"
  },
  fa: {
    details: "مشاهده جزئیات"
  }
}

export function ClassCard({ classInfo }: ClassCardProps) {
  const { language } = useLanguage();
  const content = cardContent[language];

  return (
    <Card className="flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardHeader className="p-0">
        <div className="relative aspect-[16/9]">
          <Image
            src={classInfo.imageUrl}
            alt={classInfo.title[language]}
            fill
            className="object-cover"
            data-ai-hint={classInfo.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex rtl:flex-row-reverse justify-start">
          <Badge variant="secondary" className="mr-2 rtl:ml-2 rtl:mr-0">{classInfo.type}</Badge>
          <Badge variant="outline">{classInfo.level.toUpperCase()}</Badge>
        </div>
        <CardTitle className="font-headline text-2xl">
          <Link href={`/classes/${classInfo.slug}`} className="hover:text-primary">
            {classInfo.title[language]}
          </Link>
        </CardTitle>
        <CardDescription className="mt-2 flex-1">{classInfo.excerpt[language]}</CardDescription>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full">
          <Link href={`/classes/${classInfo.slug}`}>
            {content.details}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
