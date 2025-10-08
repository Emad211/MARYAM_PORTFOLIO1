
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from 'react-dom';
import { useLanguage } from "@/context/language-context";
import { type HomeContent, type Language } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { updateHomeContent } from "@/app/actions/content-actions";

const formContent = {
  en: {
    contentTab: "Content",
    seoTab: "SEO",
    heroSection: "Hero Section",
    missionSection: "Mission Section",
    manifestoSection: "Manifesto Section",
    ctaSection: "Call to Action Section",
    blogSection: "Blog Section",
    english: "English",
    german: "German",
    persian: "Persian",
    slogan: "Slogan",
    subSlogan: "Sub-slogan",
    ctaClasses: "Classes Button Text",
    ctaFreeCourse: "Free Course Button Text",
    missionTitle: "Mission Title",
    missionText: "Mission Text",
    manifestoTitle: "Manifesto Title",
    manifestoText: "Manifesto Text",
    recentPostsTitle: "Recent Posts Title",
    readMore: "Read More Link Text",
    ctaTitle: "CTA Title",
    ctaText: "CTA Text",
    seoTitle: "SEO Title",
    seoDescription: "SEO Description",
    save: "Save Changes",
    saving: "Saving...",
    success: "Home page content updated successfully!",
    error: "Failed to update content.",
    back: "Back to Settings",
  },
  de: {
    contentTab: "Inhalt",
    seoTab: "SEO",
    heroSection: "Hero-Bereich",
    missionSection: "Missionsbereich",
    manifestoSection: "Manifest-Bereich",
    ctaSection: "Call-to-Action-Bereich",
    blogSection: "Blog-Bereich",
    english: "Englisch",
    german: "Deutsch",
    persian: "Persisch",
    slogan: "Slogan",
    subSlogan: "Unter-Slogan",
    ctaClasses: "Text für Kurs-Button",
    ctaFreeCourse: "Text für kostenlosen Kurs-Button",
    missionTitle: "Missionstitel",
    missionText: "Missionstext",
    manifestoTitle: "Manifest-Titel",
    manifestoText: "Manifest-Text",
    recentPostsTitle: "Titel für aktuelle Beiträge",
    readMore: "Text für „Weiterlesen“-Link",
    ctaTitle: "CTA-Titel",
    ctaText: "CTA-Text",
    seoTitle: "SEO-Titel",
    seoDescription: "SEO-Beschreibung",
    save: "Änderungen speichern",
    saving: "Speichern...",
    success: "Inhalt der Startseite erfolgreich aktualisiert!",
    error: "Inhalt konnte nicht aktualisiert werden.",
    back: "Zurück zu den Einstellungen",
  },
  fa: {
    contentTab: "محتوا",
    seoTab: "سئو",
    heroSection: "بخش Hero",
    missionSection: "بخش رسالت",
    manifestoSection: "بخش مانیفست",
    ctaSection: "بخش فراخوان به اقدام",
    blogSection: "بخش وبلاگ",
    english: "انگلیسی",
    german: "آلمانی",
    persian: "فارسی",
    slogan: "شعار",
    subSlogan: "شعار فرعی",
    ctaClasses: "متن دکمه کلاس‌ها",
    ctaFreeCourse: "متن دکمه دوره رایگان",
    missionTitle: "عنوان رسالت",
    missionText: "متن رسالت",
    manifestoTitle: "عنوان مانیفست",
    manifestoText: "متن مانیفست",
    recentPostsTitle: "عنوان پست‌های اخیر",
    readMore: "متن لینک بیشتر بخوانید",
    ctaTitle: "عنوان فراخوان به اقدام",
    ctaText: "متن فراخوان به اقدام",
    seoTitle: "عنوان سئو",
    seoDescription: "توضیحات سئو",
    save: "ذخیره تغییرات",
    saving: "در حال ذخیره...",
    success: "محتوای صفحه اصلی با موفقیت به‌روزرسانی شد!",
    error: "به‌روزرسانی محتوا ناموفق بود.",
    back: "بازگشت به تنظیمات",
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

export function HomeContentForm({ homeContent: initialContent }: { homeContent: HomeContent }) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const router = useRouter();
  const content = formContent[language];

  const [pageData, setPageData] = useState<HomeContent>(JSON.parse(JSON.stringify({
    ...initialContent,
    seo: initialContent.seo || { title: { en: '', de: '', fa: '' }, description: { en: '', de: '', fa: '' } }
  })));

  const handleLocalizedInputChange = (lang: Language, field: keyof Omit<HomeContent, 'seo'>, value: string) => {
    setPageData(prevData => {
      const newData = { ...prevData };
      (newData[field] as any)[lang] = value;
      return newData;
    });
  };

  const handleSeoInputChange = (lang: Language, field: 'title' | 'description', value: string) => {
    setPageData(prevData => ({
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
  
  const handleFormAction = async (formData: FormData) => {
    const result = await updateHomeContent(pageData);
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

  return (
    <form action={handleFormAction}>
        <div className="flex justify-between items-center mb-6">
             <div />
            <div className="flex items-center gap-2">
                 <Button type="button" variant="outline" onClick={() => router.push('/admin/settings')}>
                    {content.back}
                </Button>
                <SubmitButton content={content} />
            </div>
        </div>

        <Tabs defaultValue="content">
            <TabsList className="mb-4">
              <TabsTrigger value="content">{content.contentTab}</TabsTrigger>
              <TabsTrigger value="seo">{content.seoTab}</TabsTrigger>
            </TabsList>
            <TabsContent value="content">
                <Tabs defaultValue="en">
                    <TabsList>
                        <TabsTrigger value="en">{content.english}</TabsTrigger>
                        <TabsTrigger value="de">{content.german}</TabsTrigger>
                        <TabsTrigger value="fa">{content.persian}</TabsTrigger>
                    </TabsList>

                    {languages.map(lang => (
                    <TabsContent key={lang} value={lang} className="space-y-8 mt-4">
                        
                        <Card>
                            <CardHeader><CardTitle>{content.heroSection}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor={`slogan-${lang}`} className="text-base">{content.slogan}</Label>
                                    <Input id={`slogan-${lang}`} name={`slogan-${lang}`} value={pageData.slogan[lang]} onChange={e => handleLocalizedInputChange(lang, 'slogan', e.target.value)} className="text-lg"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`subSlogan-${lang}`} className="text-base">{content.subSlogan}</Label>
                                    <Textarea id={`subSlogan-${lang}`} name={`subSlogan-${lang}`} value={pageData.subSlogan[lang]} onChange={e => handleLocalizedInputChange(lang, 'subSlogan', e.target.value)} rows={3} className="text-lg" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor={`ctaClasses-${lang}`}>{content.ctaClasses}</Label>
                                        <Input id={`ctaClasses-${lang}`} name={`ctaClasses-${lang}`} value={pageData.ctaClasses[lang]} onChange={e => handleLocalizedInputChange(lang, 'ctaClasses', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`ctaFreeCourse-${lang}`}>{content.ctaFreeCourse}</Label>
                                        <Input id={`ctaFreeCourse-${lang}`} name={`ctaFreeCourse-${lang}`} value={pageData.ctaFreeCourse[lang]} onChange={e => handleLocalizedInputChange(lang, 'ctaFreeCourse', e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>{content.missionSection}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor={`missionTitle-${lang}`} className="text-base">{content.missionTitle}</Label>
                                    <Input id={`missionTitle-${lang}`} name={`missionTitle-${lang}`} value={pageData.missionTitle[lang]} onChange={e => handleLocalizedInputChange(lang, 'missionTitle', e.target.value)} className="text-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`missionText-${lang}`} className="text-base">{content.missionText}</Label>
                                    <Textarea id={`missionText-${lang}`} name={`missionText-${lang}`} value={pageData.missionText[lang]} onChange={e => handleLocalizedInputChange(lang, 'missionText', e.target.value)} rows={4} className="text-lg" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>{content.manifestoSection}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor={`manifestoTitle-${lang}`}>{content.manifestoTitle}</Label>
                                    <Input id={`manifestoTitle-${lang}`} name={`manifestoTitle-${lang}`} value={pageData.manifestoTitle[lang]} onChange={e => handleLocalizedInputChange(lang, 'manifestoTitle', e.target.value)} className="text-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`manifestoText-${lang}`} className="text-base">{content.manifestoText}</Label>
                                    <Textarea id={`manifestoText-${lang}`} name={`manifestoText-${lang}`} value={pageData.manifestoText[lang]} onChange={e => handleLocalizedInputChange(lang, 'manifestoText', e.target.value)} rows={4} className="text-lg" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>{content.blogSection}</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor={`recentPostsTitle-${lang}`}>{content.recentPostsTitle}</Label>
                                    <Input id={`recentPostsTitle-${lang}`} name={`recentPostsTitle-${lang}`} value={pageData.recentPostsTitle[lang]} onChange={e => handleLocalizedInputChange(lang, 'recentPostsTitle', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`readMore-${lang}`}>{content.readMore}</Label>
                                    <Input id={`readMore-${lang}`} name={`readMore-${lang}`} value={pageData.readMore[lang]} onChange={e => handleLocalizedInputChange(lang, 'readMore', e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle>{content.ctaSection}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor={`ctaTitle-${lang}`} className="text-base">{content.ctaTitle}</Label>
                                    <Input id={`ctaTitle-${lang}`} name={`ctaTitle-${lang}`} value={pageData.ctaTitle[lang]} onChange={e => handleLocalizedInputChange(lang, 'ctaTitle', e.target.value)} className="text-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`ctaText-${lang}`} className="text-base">{content.ctaText}</Label>
                                    <Textarea id={`ctaText-${lang}`} name={`ctaText-${lang}`} value={pageData.ctaText[lang]} onChange={e => handleLocalizedInputChange(lang, 'ctaText', e.target.value)} rows={3} className="text-lg" />
                                </div>
                            </CardContent>
                        </Card>

                    </TabsContent>
                    ))}
                </Tabs>
            </TabsContent>
            <TabsContent value="seo">
                 <Card>
                    <CardHeader><CardTitle>SEO Metadata</CardTitle></CardHeader>
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
                                        <Input id={`seo-title-${lang}`} value={pageData.seo.title[lang]} onChange={e => handleSeoInputChange(lang, 'title', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`seo-desc-${lang}`}>{content.seoDescription}</Label>
                                        <Textarea id={`seo-desc-${lang}`} value={pageData.seo.description[lang]} onChange={e => handleSeoInputChange(lang, 'description', e.target.value)} rows={3} />
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
