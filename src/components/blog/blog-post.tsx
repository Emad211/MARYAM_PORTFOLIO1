
"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useLanguage } from "@/context/language-context";
import { Badge } from "@/components/ui/badge";
import { BlogCard } from "@/components/blog/blog-card";
import { format } from "date-fns";
import { de, faIR } from 'date-fns/locale';
import type { Post } from "@/lib/types";

const content = {
  en: {
    by: "By",
    relatedArticles: "Related Articles",
  },
  de: {
    by: "Von",
    relatedArticles: "Ähnliche Artikel",
  },
  fa: {
    by: "توسط",
    relatedArticles: "مقالات مرتبط",
  },
};

const locales = { de, fa: faIR, en: undefined };

interface BlogPostProps {
  posts: Post[];
  slug: string;
}

export function BlogPost({ posts, slug }: BlogPostProps) {
  const { language } = useLanguage();

  if (!posts) {
    return <div>Loading...</div>; // Or a proper skeleton loader
  }

  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = posts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);
    
  const formattedDate = format(new Date(post.date), "PPP", {
    locale: locales[language],
  });

  return (
    <>
      <article className="py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-6">
          <header className="text-center">
            <Badge variant="outline">{post.category}</Badge>
            <h1 className="mt-4 font-headline text-4xl font-bold tracking-tight md:text-5xl">
              {post.title[language]}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {content[language].by} {post.author} &bull; {formattedDate}
            </p>
          </header>

          <div className="relative my-8 h-64 md:h-96">
            <Image
              src={post.imageUrl}
              alt={post.title[language]}
              fill
              className="rounded-lg object-cover"
              data-ai-hint={post.imageHint}
              priority
            />
          </div>

          <div
            className="prose prose-lg dark:prose-invert mx-auto max-w-3xl"
            dangerouslySetInnerHTML={{ __html: post.content[language].replace(/\n/g, '<br />') }}
          />

          <div className="mt-12 text-center">
            {post.tags.map((tag) => (
              <Badge key={tag.en} variant="secondary" className="mx-1">
                {tag[language]}
              </Badge>
            ))}
          </div>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="bg-secondary py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-6">
            <h2 className="text-center font-headline text-3xl font-bold">
              {content[language].relatedArticles}
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
