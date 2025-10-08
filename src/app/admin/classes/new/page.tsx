
"use client";

import { useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useLanguage } from "@/context/language-context";
import type { ClassLevel, ClassType, Language, ClassStatus } from "@/lib/types";
import { createClass } from "@/app/actions/content-actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const newClassContent = {
  en: {
    pageTitle: "Create New Class",
    pageDescription: "Fill in the details for the new class.",
    back: "Back to Classes",
    generalInfo: "General Information",
    contentTab: "Content",
    seoTab: "SEO",
    classType: "Class Type",
    level: "Level",
    status: "Status",
    price: "Price (Toman)",
    maxStudents: "Max Students",
    imageUrl: "Image URL",
    imageHint: "Image AI Hint",
    scheduleTime: "Schedule Time (e.g., 18:00 - 19:30)",
    english: "English",
    german: "German",
    persian: "Persian",
    title: "Title",
    excerpt: "Excerpt",
    description: "Description",
    objectives: "Objectives (one per line)",
    prerequisites: "Prerequisites (one per line)",
    scheduleDays: "Schedule Days",
    seoTitle: "SEO Title",
    seoDescription: "SEO Description",
    create: "Create Class",
    creating: "Creating...",
    success: "Class created successfully!",
    error: "Failed to create class.",
    errorTitleRequired: "English title is required to generate a slug.",
  },
  de: {
    pageTitle: "Neuen Kurs erstellen",
    pageDescription: "Füllen Sie die Details für den neuen Kurs aus.",
    back: "Zurück zu den Kursen",
    generalInfo: "Allgemeine Informationen",
    contentTab: "Inhalt",
    seoTab: "SEO",
    classType: "Kurstyp",
    level: "Niveau",
    status: "Status",
    price: "Preis (Toman)",
    maxStudents: "Max. Teilnehmer",
    imageUrl: "Bild-URL",
    imageHint: "Bild KI-Hinweis",
    scheduleTime: "Zeitplan (z.B. 18:00 - 19:30)",
    english: "Englisch",
    german: "Deutsch",
    persian: "Persisch",
    title: "Titel",
    excerpt: "Auszug",
    description: "Beschreibung",
    objectives: "Ziele (eines pro Zeile)",
    prerequisites: "Voraussetzungen (eines pro Zeile)",
    scheduleDays: "Tage des Zeitplans",
    seoTitle: "SEO-Titel",
    seoDescription: "SEO-Beschreibung",
    create: "Kurs erstellen",
    creating: "Erstellen...",
    success: "Kurs erfolgreich erstellt!",
    error: "Klasse konnte nicht erstellt werden.",
    errorTitleRequired: "Ein englischer Titel ist erforderlich, um einen Slug zu generieren.",
  },
  fa: {
    pageTitle: "ایجاد کلاس جدید",
    pageDescription: "جزئیات کلاس جدید را وارد کنید.",
    back: "بازگشت به کلاس‌ها",
    generalInfo: "اطلاعات عمومی",
    contentTab: "محتوا",
    seoTab: "سئو",
    classType: "نوع کلاس",
    level: "سطح",
    status: "وضعیت",
    price: "قیمت (تومان)",
    maxStudents: "حداکثر نفرات",
    imageUrl: "آدرس تصویر",
    imageHint: "راهنمای هوش مصنوعی تصویر",
    scheduleTime: "زمان‌بندی (مثال: ۱۸:۰۰ - ۱۹:۳۰)",
    english: "انگلیسی",
    german: "آلمانی",
    persian: "فارسی",
    title: "عنوان",
    excerpt: "خلاصه",
    description: "توضیحات",
    objectives: "اهداف (هر کدام در یک خط)",
    prerequisites: "پیش‌نیازها (هر کدام در یک خط)",
    scheduleDays: "روزهای برگزاری",
    seoTitle: "عنوان سئو",
    seoDescription: "توضیحات سئو",
    create: "ایجاد کلاس",
    creating: "در حال ایجاد...",
    success: "کلاس با موفقیت ایجاد شد!",
    error: "ایجاد کلاس ناموفق بود.",
    errorTitleRequired: "برای ساختن آدرس صفحه، عنوان انگلیسی الزامی است.",
  },
};

const levels: ClassLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
const classTypes: ClassType[] = ['private', 'group', 'workshop'];
const classStatuses: ClassStatus[] = ['active', 'full', 'inactive'];
const languages: Language[] = ['en', 'de', 'fa'];

function SubmitButton({ content }: { content: (typeof newClassContent)[Language] }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? content.creating : content.create}
    </Button>
  );
}

export default function NewClassPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const content = newClassContent[language];

  const [state, formAction] = useActionState(createClass, { success: false, message: "", slug: "" });
  
  useEffect(() => {
    if (state.success) {
      toast({
        title: content.success,
      });
      if (state.slug) {
        router.push(`/admin/classes/edit/${state.slug}`);
      } else {
        router.push('/admin/classes');
      }
    } else if (state.message) {
      const description = state.message === 'title_required' 
        ? content.errorTitleRequired 
        : state.message;
        
      toast({
        variant: "destructive",
        title: content.error,
        description: description,
      });
    }
  }, [state, router, toast, content]);

  return (
    <form action={formAction}>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/classes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{content.pageTitle}</h1>
          <p className="text-muted-foreground">{content.pageDescription}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{content.generalInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">{content.classType}</Label>
                <Select name="type" defaultValue="group">
                  <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {classTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">{content.level}</Label>
                <Select name="level" defaultValue="a1">
                  <SelectTrigger id="level"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {levels.map(level => <SelectItem key={level} value={level}>{level.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{content.status}</Label>
                <Select name="status" defaultValue="active">
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {classStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">{content.price}</Label>
                    <Input id="price" name="price" type="number" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="maxStudents">{content.maxStudents}</Label>
                    <Input id="maxStudents" name="maxStudents" type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">{content.imageUrl}</Label>
                <Input id="imageUrl" name="imageUrl" defaultValue="https://placehold.co/1280x720.png" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageHint">{content.imageHint}</Label>
                <Input id="imageHint" name="imageHint" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="scheduleTime">{content.scheduleTime}</Label>
                <Input id="scheduleTime" name="scheduleTime" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="content">
            <TabsList className="mb-4">
              <TabsTrigger value="content">{content.contentTab}</TabsTrigger>
              <TabsTrigger value="seo">{content.seoTab}</TabsTrigger>
            </TabsList>
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle>Multilingual Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="en">
                    <TabsList className="mb-4">
                      <TabsTrigger value="en">{content.english}</TabsTrigger>
                      <TabsTrigger value="de">{content.german}</TabsTrigger>
                      <TabsTrigger value="fa">{content.persian}</TabsTrigger>
                    </TabsList>
                    {languages.map(lang => (
                      <TabsContent key={lang} value={lang} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`title-${lang}`}>{content.title}</Label>
                          <Input id={`title-${lang}`} name={`title-${lang}`} />
                        </div>
                         <div className="space-y-2">
                          <Label htmlFor={`schedule-days-${lang}`}>{content.scheduleDays}</Label>
                          <Input id={`schedule-days-${lang}`} name={`schedule-days-${lang}`} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`excerpt-${lang}`}>{content.excerpt}</Label>
                          <Textarea id={`excerpt-${lang}`} name={`excerpt-${lang}`} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`description-${lang}`}>{content.description}</Label>
                          <Textarea id={`description-${lang}`} name={`description-${lang}`} rows={5} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`objectives-${lang}`}>{content.objectives}</Label>
                          <Textarea id={`objectives-${lang}`} name={`objectives-${lang}`} rows={5} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`prerequisites-${lang}`}>{content.prerequisites}</Label>
                          <Textarea id={`prerequisites-${lang}`} name={`prerequisites-${lang}`} rows={3} />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="seo">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="en">
                    <TabsList className="mb-4">
                      <TabsTrigger value="en">{content.english}</TabsTrigger>
                      <TabsTrigger value="de">{content.german}</TabsTrigger>
                      <TabsTrigger value="fa">{content.persian}</TabsTrigger>
                    </TabsList>
                    {languages.map(lang => (
                      <TabsContent key={lang} value={lang} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`seo-title-${lang}`}>{content.seoTitle}</Label>
                          <Input id={`seo-title-${lang}`} name={`seo-title-${lang}`} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`seo-desc-${lang}`}>{content.seoDescription}</Label>
                          <Textarea id={`seo-desc-${lang}`} name={`seo-desc-${lang}`} rows={3} />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/classes">{content.back}</Link>
        </Button>
        <SubmitButton content={content} />
      </div>
    </form>
  );
}
