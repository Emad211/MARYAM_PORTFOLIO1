
"use client";

import { useEffect, useActionState }from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useLanguage } from "@/context/language-context";
import type { PostCategory, Language } from "@/lib/types";
import { createPost } from "@/app/actions/content-actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const newPostContent = {
  en: {
    pageTitle: "Create New Post",
    pageDescription: "Fill in the details for your new blog post.",
    back: "Back to Posts",
    generalInfo: "General Information",
    contentTab: "Content",
    seoTab: "SEO",
    author: "Author",
    category: "Category",
    imageUrl: "Image URL",
    imageHint: "Image AI Hint",
    english: "English",
    german: "German",
    persian: "Persian",
    title: "Title",
    excerpt: "Excerpt",
    content: "Content",
    tags: "Tags (comma-separated)",
    seoTitle: "SEO Title",
    seoDescription: "SEO Description",
    create: "Create Post",
    creating: "Creating...",
    success: "Post created successfully!",
    error: "Failed to create post.",
    errorTitleRequired: "English title is required to generate a slug.",
  },
  de: {
    pageTitle: "Neuen Beitrag erstellen",
    pageDescription: "Füllen Sie die Details für Ihren neuen Blogbeitrag aus.",
    back: "Zurück zu den Beiträgen",
    generalInfo: "Allgemeine Informationen",
    contentTab: "Inhalt",
    seoTab: "SEO",
    author: "Autor",
    category: "Kategorie",
    imageUrl: "Bild-URL",
    imageHint: "Bild KI-Hinweis",
    english: "Englisch",
    german: "Deutsch",
    persian: "Persisch",
    title: "Titel",
    excerpt: "Auszug",
    content: "Inhalt",
    tags: "Tags (kommagetrennt)",
    seoTitle: "SEO-Titel",
    seoDescription: "SEO-Beschreibung",
    create: "Beitrag erstellen",
    creating: "Erstellen...",
    success: "Beitrag erfolgreich erstellt!",
    error: "Beitrag konnte nicht erstellt werden.",
    errorTitleRequired: "Ein englischer Titel ist erforderlich, um einen Slug zu generieren.",
  },
  fa: {
    pageTitle: "ایجاد پست جدید",
    pageDescription: "جزئیات پست وبلاگ جدید خود را وارد کنید.",
    back: "بازگشت به پست‌ها",
    generalInfo: "اطلاعات عمومی",
    contentTab: "محتوا",
    seoTab: "سئو",
    author: "نویسنده",
    category: "دسته بندی",
    imageUrl: "آدرس تصویر",
    imageHint: "راهنمای هوش مصنوعی تصویر",
    english: "انگلیسی",
    german: "آلمانی",
    persian: "فارسی",
    title: "عنوان",
    excerpt: "خلاصه",
    content: "محتوا",
    tags: "تگ‌ها (جدا شده با کاما)",
    seoTitle: "عنوان سئو",
    seoDescription: "توضیحات سئو",
    create: "ایجاد پست",
    creating: "در حال ایجاد...",
    success: "پست با موفقیت ایجاد شد!",
    error: "ایجاد پست ناموفق بود.",
    errorTitleRequired: "برای ساختن آدرس صفحه، عنوان انگلیسی الزامی است.",
  },
};

const categories: PostCategory[] = ['language', 'culture', 'tips'];
const languages: Language[] = ['en', 'de', 'fa'];

function SubmitButton({ content }: { content: (typeof newPostContent)[Language] }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? content.creating : content.create}
    </Button>
  );
}

export default function NewPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const content = newPostContent[language];

  const [state, formAction] = useActionState(createPost, { success: false, message: "", slug: "" });

  useEffect(() => {
    if (state.success) {
      toast({
        title: content.success,
      });
      if (state.slug) {
        router.push(`/admin/blog/edit/${state.slug}`);
      } else {
        router.push('/admin/blog');
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
            <Link href="/admin/blog">
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
                <Label htmlFor="author">{content.author}</Label>
                <Input id="author" name="author" defaultValue="LinguaSage" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{content.category}</Label>
                <Select name="category" defaultValue="language">
                  <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">{content.imageUrl}</Label>
                <Input id="imageUrl" name="imageUrl" defaultValue="https://placehold.co/1280x720.png" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageHint">{content.imageHint}</Label>
                <Input id="imageHint" name="imageHint" />
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
                          <Label htmlFor={`excerpt-${lang}`}>{content.excerpt}</Label>
                          <Textarea id={`excerpt-${lang}`} name={`excerpt-${lang}`} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`content-${lang}`}>{content.content}</Label>
                          <Textarea id={`content-${lang}`} name={`content-${lang}`} rows={8} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`tags-${lang}`}>{content.tags}</Label>
                          <Input id={`tags-${lang}`} name={`tags-${lang}`} />
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
          <Link href="/admin/blog">{content.back}</Link>
        </Button>
        <SubmitButton content={content} />
      </div>
    </form>
  );
}
