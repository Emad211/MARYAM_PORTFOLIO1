
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from 'react-dom';
import { useLanguage } from "@/context/language-context";
import { type ContactContent, type Language } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { updateContactContent } from "@/app/actions/content-actions";

const formContent = {
  en: {
    pageTitle: "Contact Page Content",
    generalInfo: "General Information",
    contactDetails: "Contact Details",
    contentTab: "Content",
    seoTab: "SEO",
    english: "English",
    german: "German",
    persian: "Persian",
    title: "Title",
    description: "Description",
    contactInfoTitle: "Contact Info Title",
    email: "Email Address",
    address: "Address",
    linkedinUrl: "LinkedIn URL",
    telegramUrl: "Telegram URL",
    seoTitle: "SEO Title",
    seoDescription: "SEO Description",
    save: "Save Changes",
    saving: "Saving...",
    success: "Contact page content updated successfully!",
    error: "Failed to update content.",
    back: "Back to Settings",
  },
  de: {
    pageTitle: "Inhalt der Kontaktseite",
    generalInfo: "Allgemeine Informationen",
    contactDetails: "Kontaktdaten",
    contentTab: "Inhalt",
    seoTab: "SEO",
    english: "Englisch",
    german: "Deutsch",
    persian: "Persisch",
    title: "Titel",
    description: "Beschreibung",
    contactInfoTitle: "Titel der Kontaktinformationen",
    email: "E-Mail-Adresse",
    address: "Adresse",
    linkedinUrl: "LinkedIn-URL",
    telegramUrl: "Telegramm-URL",
    seoTitle: "SEO-Titel",
    seoDescription: "SEO-Beschreibung",
    save: "Änderungen speichern",
    saving: "Speichern...",
    success: "Inhalt der Kontaktseite erfolgreich aktualisiert!",
    error: "Inhalt konnte nicht aktualisiert werden.",
    back: "Zurück zu den Einstellungen",
  },
  fa: {
    pageTitle: "محتوای صفحه تماس",
    generalInfo: "اطلاعات عمومی",
    contactDetails: "جزئیات تماس",
    contentTab: "محتوا",
    seoTab: "سئو",
    english: "انگلیسی",
    german: "آلمانی",
    persian: "فارسی",
    title: "عنوان",
    description: "توضیحات",
    contactInfoTitle: "عنوان اطلاعات تماس",
    email: "آدرس ایمیل",
    address: "آدرس",
    linkedinUrl: "آدرس لینکدین",
    telegramUrl: "آدرس تلگرام",
    seoTitle: "عنوان سئو",
    seoDescription: "توضیحات سئو",
    save: "ذخیره تغییرات",
    saving: "در حال ذخیره...",
    success: "محتوای صفحه تماس با موفقیت به‌روزرسانی شد!",
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

export function ContactContentForm({ contactContent: initialContent }: { contactContent: ContactContent }) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const router = useRouter();
  const content = formContent[language];

  const [pageData, setPageData] = useState<ContactContent>(JSON.parse(JSON.stringify({
    ...initialContent,
    seo: initialContent.seo || { title: { en: '', de: '', fa: '' }, description: { en: '', de: '', fa: '' } }
  })));

  const handleInputChange = (field: 'email' | 'linkedinUrl' | 'telegramUrl', value: string) => {
    setPageData(prevData => ({ ...prevData, [field]: value }));
  };

  const handleLocalizedInputChange = (lang: Language, field: keyof Omit<ContactContent, 'email' | 'linkedinUrl' | 'telegramUrl' | 'seo'>, value: string) => {
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

  const handleFormAction = async () => {
    const result = await updateContactContent(pageData);
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
            <h2 className="text-2xl font-bold tracking-tight">{content.pageTitle}</h2>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>{content.generalInfo}</CardTitle></CardHeader>
                            <CardContent>
                                <Tabs defaultValue="en">
                                    <TabsList className="mb-4">
                                        <TabsTrigger value="en">{content.english}</TabsTrigger>
                                        <TabsTrigger value="de">{content.german}</TabsTrigger>
                                        <TabsTrigger value="fa">{content.persian}</TabsTrigger>
                                    </TabsList>
                                    {languages.map(lang => (
                                        <TabsContent key={lang} value={lang} className="space-y-6 mt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`title-${lang}`} className="text-base">{content.title}</Label>
                                                <Input id={`title-${lang}`} value={pageData.title[lang]} onChange={e => handleLocalizedInputChange(lang, 'title', e.target.value)} className="text-lg"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`description-${lang}`} className="text-base">{content.description}</Label>
                                                <Textarea id={`description-${lang}`} value={pageData.description[lang]} onChange={e => handleLocalizedInputChange(lang, 'description', e.target.value)} rows={4} className="text-lg" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`contactInfoTitle-${lang}`} className="text-base">{content.contactInfoTitle}</Label>
                                                <Input id={`contactInfoTitle-${lang}`} value={pageData.contactInfo[lang]} onChange={e => handleLocalizedInputChange(lang, 'contactInfo', e.target.value)} className="text-lg"/>
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader><CardTitle>{content.contactDetails}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-base">{content.email}</Label>
                                    <Input id="email" value={pageData.email} onChange={e => handleInputChange('email', e.target.value)} className="text-lg"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="linkedinUrl" className="text-base">{content.linkedinUrl}</Label>
                                    <Input id="linkedinUrl" value={pageData.linkedinUrl} onChange={e => handleInputChange('linkedinUrl', e.target.value)} className="text-lg"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telegramUrl" className="text-base">{content.telegramUrl}</Label>
                                    <Input id="telegramUrl" value={pageData.telegramUrl} onChange={e => handleInputChange('telegramUrl', e.target.value)} className="text-lg"/>
                                </div>
                                 <Tabs defaultValue="en">
                                    <TabsList className="mb-4">
                                        <TabsTrigger value="en">{content.english}</TabsTrigger>
                                        <TabsTrigger value="de">{content.german}</TabsTrigger>
                                        <TabsTrigger value="fa">{content.persian}</TabsTrigger>
                                    </TabsList>
                                    {languages.map(lang => (
                                        <TabsContent key={lang} value={lang} className="space-y-6 mt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`address-${lang}`} className="text-base">{content.address}</Label>
                                                <Input id={`address-${lang}`} value={pageData.address[lang]} onChange={e => handleLocalizedInputChange(lang, 'address', e.target.value)} className="text-lg"/>
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
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
