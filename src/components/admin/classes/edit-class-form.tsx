
"use client";

import { useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useLanguage } from "@/context/language-context";
import type { Class, ClassLevel, ClassType, Language, LocalizedString, ClassStatus } from "@/lib/types";
import { updateClass } from "@/app/actions/content-actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const editClassContent = {
  en: {
    pageTitle: "Edit Class",
    pageDescription: "Modify the details of the class below.",
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
    save: "Save Changes",
    saving: "Saving...",
    success: "Class updated successfully!",
    error: "Failed to update class.",
  },
  de: {
    pageTitle: "Kurs bearbeiten",
    pageDescription: "Ändern Sie die Details des Kurses unten.",
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
    save: "Änderungen speichern",
    saving: "Speichern...",
    success: "Kurs erfolgreich aktualisiert!",
    error: "Klasse konnte nicht aktualisiert werden.",
  },
  fa: {
    pageTitle: "ویرایش کلاس",
    pageDescription: "جزئیات کلاس را در زیر تغییر دهید.",
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
    save: "ذخیره تغییرات",
    saving: "در حال ذخیره...",
    success: "کلاس با موفقیت به‌روزرسانی شد!",
    error: "به روز رسانی کلاس انجام نشد.",
  },
};

const levels: ClassLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
const classTypes: ClassType[] = ['private', 'group', 'workshop'];
const classStatuses: ClassStatus[] = ['active', 'full', 'inactive'];
const languages: Language[] = ['en', 'de', 'fa'];

function SubmitButton({ content }: { content: (typeof editClassContent)[Language] }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? content.saving : content.save}
    </Button>
  );
}

export function EditClassForm({ classes, slug }: { classes: Class[], slug: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const content = editClassContent[language];
  
  const [classData, setClassData] = useState<Class | null>(null);

  useEffect(() => {
    const data = classes.find((c) => c.slug === slug);
    if (data) {
      const formattedData = {
          ...JSON.parse(JSON.stringify(data)),
          seo: data.seo || { title: { en: '', de: '', fa: '' }, description: { en: '', de: '', fa: '' } }
      };
      setClassData(formattedData);
    } else {
      notFound();
    }
  }, [slug, classes]);

  const handleInputChange = (field: keyof Class, value: any) => {
    if (classData) {
      setClassData({ ...classData, [field]: value });
    }
  };

  const handleLocalizedInputChange = (lang: Language, field: 'title' | 'excerpt' | 'description', value: string) => {
    if (classData) {
        setClassData({
            ...classData,
            [field]: {
                ...classData[field],
                [lang]: value,
            },
        });
    }
  };
  
  const handleSeoInputChange = (lang: Language, field: 'title' | 'description', value: string) => {
    if (classData) {
      setClassData({
        ...classData,
        seo: {
          ...classData.seo,
          [field]: {
            ...classData.seo[field],
            [lang]: value,
          },
        },
      });
    }
  };

  const handleListChange = (lang: Language, field: 'objectives' | 'prerequisites', value: string) => {
    if (classData) {
        const lines = value.split('\n');
        const newList: LocalizedString[] = JSON.parse(JSON.stringify(classData[field]));

        lines.forEach((line, index) => {
            if (newList[index]) {
                newList[index][lang] = line;
            } else {
                const newItem: LocalizedString = { en: '', de: '', fa: '' };
                newItem[lang] = line;
                newList.push(newItem);
            }
        });

        newList.length = lines.length;
        setClassData({ ...classData, [field]: newList });
    }
  };
  
  const handleFormAction = async () => {
    if (!classData) return;
    
    const dataToSave = {
      ...classData,
      price: classData.price === undefined || classData.price === null || isNaN(Number(classData.price)) ? undefined : Number(classData.price),
      maxStudents: classData.maxStudents === undefined || classData.maxStudents === null || isNaN(Number(classData.maxStudents)) ? undefined : Number(classData.maxStudents),
    }

    const result = await updateClass(dataToSave);
    if (result.success) {
      toast({
        title: content.success,
      });
      router.refresh(); 
    } else {
      toast({
        variant: "destructive",
        title: content.error,
        description: result.message,
      });
    }
  };


  if (!classData) {
    return <div>Loading...</div>;
  }

  return (
    <form action={handleFormAction}>
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
                <Label htmlFor="classType">{content.classType}</Label>
                <Select value={classData.type} onValueChange={(value) => handleInputChange('type', value as ClassType)}>
                  <SelectTrigger id="classType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {classTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">{content.level}</Label>
                <Select value={classData.level} onValueChange={(value) => handleInputChange('level', value as ClassLevel)}>
                  <SelectTrigger id="level"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {levels.map(level => <SelectItem key={level} value={level}>{level.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{content.status}</Label>
                <Select value={classData.status} onValueChange={(value) => handleInputChange('status', value as ClassStatus)}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {classStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">{content.price}</Label>
                    <Input id="price" type="number" value={classData.price ?? ''} onChange={(e) => handleInputChange('price', e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="maxStudents">{content.maxStudents}</Label>
                    <Input id="maxStudents" type="number" value={classData.maxStudents ?? ''} onChange={(e) => handleInputChange('maxStudents', e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">{content.imageUrl}</Label>
                <Input id="imageUrl" value={classData.imageUrl} onChange={(e) => handleInputChange('imageUrl', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageHint">{content.imageHint}</Label>
                <Input id="imageHint" value={classData.imageHint} onChange={(e) => handleInputChange('imageHint', e.target.value)} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="scheduleTime">{content.scheduleTime}</Label>
                <Input id="scheduleTime" value={classData.schedule.time} onChange={(e) => setClassData({...classData, schedule: {...classData.schedule, time: e.target.value}})} />
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
                          <Input id={`title-${lang}`} value={classData.title[lang]} onChange={e => handleLocalizedInputChange(lang, 'title', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                          <Label htmlFor={`schedule-days-${lang}`}>{content.scheduleDays}</Label>
                          <Input id={`schedule-days-${lang}`} value={classData.schedule.days[lang]} onChange={e => setClassData({...classData, schedule: {...classData.schedule, days: {...classData.schedule.days, [lang]: e.target.value}}})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`excerpt-${lang}`}>{content.excerpt}</Label>
                          <Textarea id={`excerpt-${lang}`} value={classData.excerpt[lang]} onChange={e => handleLocalizedInputChange(lang, 'excerpt', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`description-${lang}`}>{content.description}</Label>
                          <Textarea id={`description-${lang}`} rows={5} value={classData.description[lang]} onChange={e => handleLocalizedInputChange(lang, 'description', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`objectives-${lang}`}>{content.objectives}</Label>
                          <Textarea id={`objectives-${lang}`} rows={5} value={classData.objectives.map(o => o[lang] || '').join('\n')} onChange={e => handleListChange(lang, 'objectives', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`prerequisites-${lang}`}>{content.prerequisites}</Label>
                          <Textarea id={`prerequisites-${lang}`} rows={3} value={classData.prerequisites.map(p => p[lang] || '').join('\n')} onChange={e => handleListChange(lang, 'prerequisites', e.target.value)} />
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
                          <Input id={`seo-title-${lang}`} value={classData.seo.title[lang]} onChange={e => handleSeoInputChange(lang, 'title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`seo-desc-${lang}`}>{content.seoDescription}</Label>
                          <Textarea id={`seo-desc-${lang}`} value={classData.seo.description[lang]} onChange={e => handleSeoInputChange(lang, 'description', e.target.value)} rows={3} />
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
