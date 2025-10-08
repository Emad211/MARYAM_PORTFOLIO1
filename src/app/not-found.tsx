
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/language-context";

const notFoundContent = {
  en: {
    title: "Page Not Found",
    description: "Oops! The page you are looking for does not exist or has been moved.",
    button: "Go Back Home",
  },
  de: {
    title: "Seite nicht gefunden",
    description: "Hoppla! Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.",
    button: "Zurück zur Startseite",
  },
  fa: {
    title: "صفحه پیدا نشد",
    description: "اوه! صفحه‌ای که به دنبال آن هستید وجود ندارد یا منتقل شده است.",
    button: "بازگشت به صفحه اصلی",
  },
};

export default function NotFound() {
  const { language } = useLanguage();
  const content = notFoundContent[language];

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
      <div className="container mx-auto max-w-md px-6 py-12">
        <AlertTriangle className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-6 font-headline text-4xl font-bold tracking-tight md:text-5xl">
          {content.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {content.description}
        </p>
        <Button asChild size="lg" className="mt-8 font-semibold">
          <Link href="/">{content.button}</Link>
        </Button>
      </div>
    </div>
  );
}
