
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from 'react-dom';
import { useLanguage } from "@/context/language-context";
import { type AboutContent, type TimelineEvent, type Language } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { updateAboutContent, updateTimeline } from "@/app/actions/content-actions";
import { PlusCircle, Trash2 } from "lucide-react";

const formContent = {
  en: {
    contentTab: "Page Content",
    timelineTab: "Timeline",
    seoTab: "SEO",
    storySection: "Story Section",
    qualificationsSection: "Qualifications Section",
    timelineSection: "Timeline Section",
    english: "English",
    german: "German",
    persian: "Persian",
    title: "Title",
    story: "Story",
    qualificationsTitle: "Qualifications Title",
    testdafTitle: "TestDaF Certificate Title",
    testdafDescription: "TestDaF Certificate Description",
    timelineTitle: "Timeline Title",
    seoTitle: "SEO Title",
    seoDescription: "SEO Description",
    save: "Save Changes",
    saving: "Saving...",
    success: "About page content updated successfully!",
    error: "Failed to update content.",
    back: "Back to Settings",
    year: "Year",
    description: "Description",
    addEvent: "Add Event",
    removeEvent: "Remove Event",
  },
  de: {
    contentTab: "Seiteninhalt",
    timelineTab: "Zeitachse",
    seoTab: "SEO",
    storySection: "Story-Bereich",
    qualificationsSection: "Qualifikationsbereich",
    timelineSection: "Zeitachsenbereich",
    english: "Englisch",
    german: "Deutsch",
    persian: "Persisch",
    title: "Titel",
    story: "Geschichte",
    qualificationsTitle: "Titel der Qualifikationen",
    testdafTitle: "Titel des TestDaF-Zertifikats",
    testdafDescription: "Beschreibung des TestDaF-Zertifikats",
    timelineTitle: "Titel der Zeitachse",
    seoTitle: "SEO-Titel",
    seoDescription: "SEO-Beschreibung",
    save: "Änderungen speichern",
    saving: "Speichern...",
    success: "Inhalt der Über-mich-Seite erfolgreich aktualisiert!",
    error: "Inhalt konnte nicht aktualisiert werden.",
    back: "Zurück zu den Einstellungen",
    year: "Jahr",
    description: "Beschreibung",
    addEvent: "Ereignis hinzufügen",
    removeEvent: "Ereignis entfernen",
  },
  fa: {
    contentTab: "محتوای صفحه",
    timelineTab: "خط زمانی",
    seoTab: "سئو",
    storySection: "بخش داستان",
    qualificationsSection: "بخش صلاحیت‌ها",
    timelineSection: "بخش خط زمانی",
    english: "انگلیسی",
    german: "آلمانی",
    persian: "فارسی",
    title: "عنوان",
    story: "داستان",
    qualificationsTitle: "عنوان صلاحیت‌ها",
    testdafTitle: "عنوان مدرک TestDaF",
    testdafDescription: "توضیحات مدرک TestDaF",
    timelineTitle: "عنوان خط زمانی",
    seoTitle: "عنوان سئو",
    seoDescription: "توضیحات سئو",
    save: "ذخیره تغییرات",
    saving: "در حال ذخیره...",
    success: "محتوای صفحه درباره من با موفقیت به‌روزرسانی شد!",
    error: "به‌روزرسانی محتوا ناموفق بود.",
    back: "بازگشت به تنظیمات",
    year: "سال",
    description: "توضیحات",
    addEvent: "افزودن رویداد",
    removeEvent: "حذف رویداد",
  },
};

const languages: Language[] = ['en', 'de', 'fa'];

function SubmitButton({ content }: { content: (typeof formContent)[Language] }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? content.saving : content.save}
    </Button>
  );
}

export function AboutContentForm({ 
    aboutContent: initialAboutContent, 
    timeline: initialTimeline 
}: { 
    aboutContent: AboutContent,
    timeline: TimelineEvent[] 
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const router = useRouter();
  const content = formContent[language];

  const [aboutData, setAboutData] = useState<AboutContent>(JSON.parse(JSON.stringify({
    ...initialAboutContent,
    seo: initialAboutContent.seo || { title: { en: '', de: '', fa: '' }, description: { en: '', de: '', fa: '' } }
  })));
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>(JSON.parse(JSON.stringify(initialTimeline)));

  const handleAboutInputChange = (lang: Language, field: keyof AboutContent, value: string) => {
    setAboutData(prevData => {
      const newData = { ...prevData };
      (newData[field] as Record<Language, string>)[lang] = value;
      return newData;
    });
  };

   const handleSeoInputChange = (lang: Language, field: 'title' | 'description', value: string) => {
    setAboutData(prevData => ({
        ...prevData,
        seo: {
            ...prevData.seo,
            [field]: {
                ...prevData.seo[field],
                [lang]: value,
            },
        },
    }));
  };
  
  const handleTimelineChange = (index: number, field: 'year' | 'title' | 'description', value: string, lang?: Language) => {
    const newTimelineData = [...timelineData];
    const item = newTimelineData[index];
    if (!item) return; // guard
    if (field === 'year') {
        item.year = value;
    } else {
        if (lang) {
            item[field] = item[field] || { en: '', de: '', fa: '' };
            (item[field] as Record<Language, string>)[lang] = value;
        }
    }
    setTimelineData(newTimelineData);
  };
  
  const addTimelineEvent = () => {
    const newEvent: TimelineEvent = {
        year: new Date().getFullYear().toString(),
        title: { en: '', de: '', fa: '' },
        description: { en: '', de: '', fa: '' }
    };
    setTimelineData([...timelineData, newEvent]);
  };

  const removeTimelineEvent = (index: number) => {
    const newTimelineData = timelineData.filter((_, i) => i !== index);
    setTimelineData(newTimelineData);
  };

  const handleFormAction = async () => {
    const aboutResult = await updateAboutContent(aboutData);
    const timelineResult = await updateTimeline(timelineData);

    if (aboutResult.success && timelineResult.success) {
      toast({
        title: content.success,
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: content.error,
        description: aboutResult.message || timelineResult.message,
      });
    }
  };

  return (
    <form action={handleFormAction}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Edit About Page</h2>
            <div className="flex items-center gap-2">
                 <Button type="button" variant="outline" onClick={() => router.push('/admin/settings')}>
                    {content.back}
                </Button>
                <SubmitButton content={content} />
            </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
            <TabsList>
                <TabsTrigger value="content">{content.contentTab}</TabsTrigger>
                <TabsTrigger value="timeline">{content.timelineTab}</TabsTrigger>
                <TabsTrigger value="seo">{content.seoTab}</TabsTrigger>
            </TabsList>
            <TabsContent value="content">
                <Tabs defaultValue="en" className="mt-4">
                    <TabsList>
                        <TabsTrigger value="en">{content.english}</TabsTrigger>
                        <TabsTrigger value="de">{content.german}</TabsTrigger>
                        <TabsTrigger value="fa">{content.persian}</TabsTrigger>
                    </TabsList>

                    {languages.map(lang => (
                    <TabsContent key={lang} value={lang} className="space-y-8 mt-4">
                        <Card>
                            <CardHeader><CardTitle>{content.storySection}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor={`title-${lang}`} className="text-base">{content.title}</Label>
                                    <Input id={`title-${lang}`} value={aboutData.title[lang]} onChange={e => handleAboutInputChange(lang, 'title', e.target.value)} className="text-lg"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`story-${lang}`} className="text-base">{content.story}</Label>
                                    <Textarea id={`story-${lang}`} value={aboutData.story[lang]} onChange={e => handleAboutInputChange(lang, 'story', e.target.value)} rows={6} className="text-lg" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>{content.qualificationsSection}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor={`qualificationsTitle-${lang}`} className="text-base">{content.qualificationsTitle}</Label>
                                    <Input id={`qualificationsTitle-${lang}`} value={aboutData.qualificationsTitle[lang]} onChange={e => handleAboutInputChange(lang, 'qualificationsTitle', e.target.value)} className="text-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`testdafTitle-${lang}`} className="text-base">{content.testdafTitle}</Label>
                                    <Input id={`testdafTitle-${lang}`} value={aboutData.testdafTitle[lang]} onChange={e => handleAboutInputChange(lang, 'testdafTitle', e.target.value)} className="text-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`testdafDescription-${lang}`} className="text-base">{content.testdafDescription}</Label>
                                    <Textarea id={`testdafDescription-${lang}`} value={aboutData.testdafDescription[lang]} onChange={e => handleAboutInputChange(lang, 'testdafDescription', e.target.value)} rows={3} className="text-lg" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    ))}
                </Tabs>
            </TabsContent>
            <TabsContent value="timeline">
                <Card className="mt-4">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{content.timelineSection}</CardTitle>
                            <Button type="button" size="sm" onClick={addTimelineEvent}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {content.addEvent}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {timelineData.map((event, index) => (
                            <Card key={index} className="p-4 bg-muted/50 relative">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`year-${index}`}>{content.year}</Label>
                                        <Input id={`year-${index}`} value={event.year} onChange={e => handleTimelineChange(index, 'year', e.target.value)} className="font-bold text-lg w-32" />
                                    </div>
                                    <Tabs defaultValue="en">
                                        <TabsList>
                                            <TabsTrigger value="en">{content.english}</TabsTrigger>
                                            <TabsTrigger value="de">{content.german}</TabsTrigger>
                                            <TabsTrigger value="fa">{content.persian}</TabsTrigger>
                                        </TabsList>
                                        {languages.map(lang => (
                                            <TabsContent key={lang} value={lang} className="mt-4 space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`timeline-title-${index}-${lang}`}>{content.title}</Label>
                                                    <Input id={`timeline-title-${index}-${lang}`} value={event.title[lang]} onChange={e => handleTimelineChange(index, 'title', e.target.value, lang)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`timeline-desc-${index}-${lang}`}>{content.description}</Label>
                                                    <Textarea id={`timeline-desc-${index}-${lang}`} value={event.description[lang]} onChange={e => handleTimelineChange(index, 'description', e.target.value, lang)} rows={3} />
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                </div>
                                <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4" onClick={() => removeTimelineEvent(index)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">{content.removeEvent}</span>
                                </Button>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="seo">
                <Card className="mt-4">
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
                                        <Input id={`seo-title-${lang}`} value={aboutData.seo.title[lang]} onChange={e => handleSeoInputChange(lang, 'title', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`seo-desc-${lang}`}>{content.seoDescription}</Label>
                                        <Textarea id={`seo-desc-${lang}`} value={aboutData.seo.description[lang]} onChange={e => handleSeoInputChange(lang, 'description', e.target.value)} rows={3} />
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      
      <div className="mt-8 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/settings')}>
            {content.back}
        </Button>
        <SubmitButton content={content} />
      </div>
    </form>
  );
}
