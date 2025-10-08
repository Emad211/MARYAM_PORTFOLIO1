
"use client";

import { useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useLanguage } from "@/context/language-context";
import type { Post, PostCategory, Language, LocalizedString } from "@/lib/types";
import { updatePost } from "@/app/actions/content-actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const editPostContent = {
  en: {
    pageTitle: "Edit Post",
    pageDescription: "Modify the details of the blog post below.",
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
    save: "Save Changes",
    saving: "Saving...",
    success: "Post updated successfully!",
    error: "Failed to update post.",
  },
  de: {
    pageTitle: "Beitrag bearbeiten",
    pageDescription: "Ändern Sie die Details des Blogbeitrags unten.",
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
    save: "Änderungen speichern",
    saving: "Speichern...",
    success: "Beitrag erfolgreich aktualisiert!",
    error: "Beitrag konnte nicht aktualisiert werden.",
  },
  fa: {
    pageTitle: "ویرایش پست",
    pageDescription: "جزئیات پست وبلاگ را در زیر تغییر دهید.",
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
    save: "ذخیره تغییرات",
    saving: "در حال ذخیره...",
    success: "پست با موفقیت به‌روزرسانی شد!",
    error: "به‌روزرسانی پست ناموفق بود.",
  },
};

const categories: PostCategory[] = ['language', 'culture', 'tips'];
const languages: Language[] = ['en', 'de', 'fa'];

function SubmitButton({ content }: { content: (typeof editPostContent)[Language] }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? content.saving : content.save}
    </Button>
  );
}

export function EditPostForm({ posts, slug }: { posts: Post[], slug: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const content = editPostContent[language];
  
  const [postData, setPostData] = useState<Post | null>(null);

  useEffect(() => {
    const data = posts.find((p) => p.slug === slug);
    if (data) {
      // Deep copy, format tags, and ensure seo object exists
      const formattedData = {
          ...JSON.parse(JSON.stringify(data)),
          tags: data.tags.map(tag => 
              typeof tag === 'string' ? { en: tag, de: tag, fa: tag } : tag
          ),
          seo: data.seo || { title: { en: '', de: '', fa: '' }, description: { en: '', de: '', fa: '' } }
      };
      setPostData(formattedData);
    } else {
      notFound();
    }
  }, [slug, posts]);

  const handleInputChange = (field: keyof Post, value: any) => {
    if (postData) {
      setPostData({ ...postData, [field]: value });
    }
  };

  const handleLocalizedInputChange = (lang: Language, field: 'title' | 'excerpt' | 'content', value: string) => {
    if (postData) {
        setPostData({
            ...postData,
            [field]: {
                ...postData[field],
                [lang]: value,
            },
        });
    }
  };

  const handleSeoInputChange = (lang: Language, field: 'title' | 'description', value: string) => {
    if (postData) {
      setPostData({
        ...postData,
        seo: {
          ...postData.seo,
          [field]: {
            ...postData.seo[field],
            [lang]: value,
          },
        },
      });
    }
  };
  
  const handleTagsChange = (lang: Language, value: string) => {
    if (postData) {
      const tagStrings = value.split(',').map(t => t.trim());
      const newTags: LocalizedString[] = [...postData.tags];

      tagStrings.forEach((tagString, index) => {
        if (newTags[index]) {
          newTags[index] = { ...newTags[index], [lang]: tagString };
        } else {
          const newTag: LocalizedString = { en: '', de: '', fa: '' };
          newTag[lang] = tagString;
          newTags.push(newTag);
        }
      });

      // Trim excess tags if the new list is shorter
      newTags.length = tagStrings.length;

      setPostData({ ...postData, tags: newTags });
    }
  };

  const handleFormAction = async () => {
    if (!postData) return;

    const result = await updatePost(postData);
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

  if (!postData) {
    return <div>Loading...</div>;
  }

  return (
    <form action={handleFormAction}>
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
                <Input id="author" value={postData.author} onChange={(e) => handleInputChange('author', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{content.category}</Label>
                <Select value={postData.category} onValueChange={(value) => handleInputChange('category', value as PostCategory)}>
                  <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">{content.imageUrl}</Label>
                <Input id="imageUrl" value={postData.imageUrl} onChange={(e) => handleInputChange('imageUrl', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageHint">{content.imageHint}</Label>
                <Input id="imageHint" value={postData.imageHint} onChange={(e) => handleInputChange('imageHint', e.target.value)} />
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
                          <Input id={`title-${lang}`} value={postData.title[lang]} onChange={e => handleLocalizedInputChange(lang, 'title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`excerpt-${lang}`}>{content.excerpt}</Label>
                          <Textarea id={`excerpt-${lang}`} value={postData.excerpt[lang]} onChange={e => handleLocalizedInputChange(lang, 'excerpt', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`content-${lang}`}>{content.content}</Label>
                          <Textarea id={`content-${lang}`} rows={8} value={postData.content[lang]} onChange={e => handleLocalizedInputChange(lang, 'content', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`tags-${lang}`}>{content.tags}</Label>
                          <Input id={`tags-${lang}`} value={postData.tags.map(t => t[lang]).join(', ')} onChange={(e) => handleTagsChange(lang, e.target.value)} />
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
                          <Input id={`seo-title-${lang}`} value={postData.seo.title[lang]} onChange={e => handleSeoInputChange(lang, 'title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`seo-desc-${lang}`}>{content.seoDescription}</Label>
                          <Textarea id={`seo-desc-${lang}`} value={postData.seo.description[lang]} onChange={e => handleSeoInputChange(lang, 'description', e.target.value)} rows={3} />
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
