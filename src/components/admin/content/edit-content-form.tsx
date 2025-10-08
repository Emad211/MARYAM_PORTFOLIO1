
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { HomeContentForm } from "@/components/admin/content/home-content-form";
import { AboutContentForm } from "@/components/admin/content/about-content-form";
import { ContactContentForm } from "@/components/admin/content/contact-content-form";
import type { AboutContent, ContactContent, HomeContent, TimelineEvent } from "@/lib/types";

const editContentPageContent = {
  en: {
    pageTitleHome: "Edit Home Page",
    pageDescriptionHome: "Modify the content for the main landing page.",
    pageTitleAbout: "Edit About Page",
    pageDescriptionAbout: "Modify the content for the 'About' page.",
    pageTitleContact: "Edit Contact Page",
    pageDescriptionContact: "Modify the content for the 'Contact' page.",
    back: "Back to Settings",
    error: "This content page is not editable.",
  },
  de: {
    pageTitleHome: "Startseite bearbeiten",
    pageDescriptionHome: "Ändern Sie den Inhalt der Haupt-Landing-Page.",
    pageTitleAbout: "Über-mich-Seite bearbeiten",
    pageDescriptionAbout: "Ändern Sie den Inhalt der 'Über mich'-Seite.",
    pageTitleContact: "Kontaktseite bearbeiten",
    pageDescriptionContact: "Ändern Sie den Inhalt der 'Kontakt'-Seite.",
    back: "Zurück zu den Einstellungen",
    error: "Diese Inhaltsseite ist nicht bearbeitbar.",
  },
  fa: {
    pageTitleHome: "ویرایش صفحه اصلی",
    pageDescriptionHome: "محتوای صفحه اصلی فرود را تغییر دهید.",
    pageTitleAbout: "ویرایش صفحه درباره من",
    pageDescriptionAbout: "محتوای صفحه 'درباره من' را تغییر دهید.",
    pageTitleContact: "ویرایش صفحه تماس",
    pageDescriptionContact: "محتوای صفحه 'تماس' را تغییر دهید.",
    back: "بازگشت به تنظیمات",
    error: "این صفحه محتوا قابل ویرایش نیست.",
  },
};

interface EditContentFormProps {
    slug: string;
    homeContent: HomeContent;
    aboutContent: AboutContent;
    timeline: TimelineEvent[];
    contactContent: ContactContent;
}

export function EditContentForm({ 
    slug, 
    homeContent, 
    aboutContent, 
    timeline, 
    contactContent 
}: EditContentFormProps) {
  const { language } = useLanguage();
  const content = editContentPageContent[language];
  const { toast } = useToast();
  const router = useRouter();
  
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const isKnownSlug = ['home', 'about', 'contact'].includes(slug);
  
  useEffect(() => {
    if (isClient && !isKnownSlug) {
      toast({
        variant: "destructive",
        title: "Not Found",
        description: content.error,
      });
      router.push('/admin/settings');
    }
  }, [isClient, isKnownSlug, content.error, router, toast]);

  if (!isKnownSlug) {
    return null; 
  }

  let pageTitle = "";
  let pageDescription = "";
  let formComponent: React.ReactNode = null;

  if (slug === 'home') {
    pageTitle = content.pageTitleHome;
    pageDescription = content.pageDescriptionHome;
    formComponent = <HomeContentForm homeContent={homeContent} />;
  } else if (slug === 'about') {
    pageTitle = content.pageTitleAbout;
    pageDescription = content.pageDescriptionAbout;
    formComponent = <AboutContentForm aboutContent={aboutContent} timeline={timeline} />;
  } else if (slug === 'contact') {
    pageTitle = content.pageTitleContact;
    pageDescription = content.pageDescriptionContact;
    formComponent = <ContactContentForm contactContent={contactContent} />;
  }

  return (
    <div>
        <div className="flex items-center gap-4 mb-6">
            <Link href="/admin/settings">
                <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
                <p className="text-muted-foreground">{pageDescription}</p>
            </div>
        </div>
      
        {formComponent}
    </div>
  );
}
