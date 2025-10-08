
"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import type { Post } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { de, faIR } from 'date-fns/locale';

interface BlogCardProps {
  post: Post;
}

const cardContent = {
  en: { readMore: "Read More" },
  de: { readMore: "Weiterlesen" },
  fa: { readMore: "بیشتر بخوانید" }
}

const locales = { de, fa: faIR, en: undefined };

export function BlogCard({ post }: BlogCardProps) {
  const { language } = useLanguage();
  const content = cardContent[language];
  const formattedDate = format(new Date(post.date), "PPP", {
    locale: locales[language],
  });

  return (
    <Card className="flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardHeader className="p-0">
        <Link href={`/blog/${post.slug}`} className="block relative aspect-[16/9]">
          <Image
            src={post.imageUrl}
            alt={post.title[language]}
            fill
            className="object-cover"
            data-ai-hint={post.imageHint}
          />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-6">
        <div>
          <Badge variant="outline" className="mr-2">{post.category}</Badge>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
        <CardTitle className="mt-2 font-headline text-xl">
          <Link href={`/blog/${post.slug}`} className="hover:text-primary">
            {post.title[language]}
          </Link>
        </CardTitle>
        <CardDescription className="mt-2 flex-1 text-sm">{post.excerpt[language]}</CardDescription>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild variant="link" className="p-0 font-semibold text-primary">
          <Link href={`/blog/${post.slug}`}>
            {content.readMore} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
