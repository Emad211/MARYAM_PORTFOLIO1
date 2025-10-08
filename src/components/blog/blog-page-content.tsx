
"use client";

import { useState } from "react";
import { useLanguage } from "@/context/language-context";
import type { Post, PostCategory } from "@/lib/types";
import { BlogCard } from "@/components/blog/blog-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

const blogContent = {
  en: {
    title: "Fluentia Blog",
    description: "Insights on language, culture, and learning. Explore articles to deepen your understanding and accelerate your journey.",
    search: "Search articles...",
    all: "All",
    language: "Language",
    culture: "Culture",
    tips: "Tips",
  },
  de: {
    title: "Fluentia Blog",
    description: "Einblicke in Sprache, Kultur und Lernen. Entdecken Sie Artikel, um Ihr Verständnis zu vertiefen und Ihre Reise zu beschleunigen.",
    search: "Artikel suchen...",
    all: "Alle",
    language: "Sprache",
    culture: "Kultur",
    tips: "Tipps",
  },
  fa: {
    title: "بلاگ Fluentia",
    description: "بینش‌هایی در مورد زبان، فرهنگ و یادگیری. مقالات را برای تعمیق درک و تسریع سفر خود کاوش کنید.",
    search: "جستجوی مقالات...",
    all: "همه",
    language: "زبان",
    culture: "فرهنگ",
    tips: "نکات",
  },
};

export function BlogPageContent({ posts }: { posts: Post[] }) {
  const { language } = useLanguage();
  const content = blogContent[language];

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<PostCategory | 'all'>('all');

  const filteredPosts = posts.filter(post => {
    const categoryMatch = activeCategory === 'all' || post.category === activeCategory;
    const searchMatch = searchTerm === "" || 
      post.title[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content[language].toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">
            {content.title}
          </h1>
          <p className="mt-4 mx-auto max-w-3xl text-lg text-muted-foreground">
            {content.description}
          </p>
        </div>

        <div className="my-12 flex flex-col items-center gap-4 md:flex-row md:justify-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={content.search}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as PostCategory | 'all')}>
            <TabsList>
              <TabsTrigger value="all">{content.all}</TabsTrigger>
              <TabsTrigger value="language">{content.language}</TabsTrigger>
              <TabsTrigger value="culture">{content.culture}</TabsTrigger>
              <TabsTrigger value="tips">{content.tips}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post: Post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>No articles match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
