
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import type { Post, Language, HomeContent as HomeContentType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POST_CATEGORY_LABELS } from "@/lib/label-utils";

const heroImageAlts: Record<Language, string> = {
  en: "Watercolor artwork with German words for culture and communication",
  de: "Aquarell-Kunstwerk mit deutschen Woertern fuer Kultur und Kommunikation",
  fa: "اثر آبرنگی با واژه‌های آلمانی درباره فرهنگ و ارتباط",
};

const teachingImageAlts: Record<Language, string> = {
  en: "Books and coffee on a study desk",
  de: "Buecher und Kaffee auf einem Lerntisch",
  fa: "کتاب‌ها و قهوه روی میز مطالعه",
};

interface HomePageContentProps {
  homeContent: HomeContentType;
  posts: Post[];
}

export function HomePageContent({ homeContent, posts }: HomePageContentProps) {
  return (
    <>
      <HeroSection content={homeContent} />
      <MissionSection content={homeContent} />
      <ManifestoSection content={homeContent} />
      <RecentPostsSection content={homeContent} posts={posts} />
      <CallToActionSection content={homeContent} />
    </>
  );
}

function HeroSection({ content }: { content: HomeContentType }) {
  const { language } = useLanguage();

  if (!content) {
    return <div>Loading...</div>; // Or a proper skeleton loader
  }

  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          {/* Text: LTR -> order 1, RTL -> order 2 */}
          <div className="text-center md:text-left rtl:md:text-right md:order-1 rtl:md:order-2">
            <h1 className="font-headline text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {content.slogan[language]}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              {content.subSlogan[language]}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
              <Button asChild size="lg" className="font-semibold">
                <Link href="/classes">{content.ctaClasses[language]}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold">
                <Link href="/classes/free-mitreden-workshop">{content.ctaFreeCourse[language]}</Link>
              </Button>
            </div>
          </div>
           {/* Image: LTR -> order 2, RTL -> order 1 */}
          <div className="relative flex justify-center items-center h-full min-h-[300px] md:min-h-[400px] md:order-2 rtl:md:order-1">
            <Image
              src="/flux-1-kontext-pro_A_dynamic_and_organiiiiii.png"
              alt={heroImageAlts[language]}
              width={600}
              height={400}
              className="rounded-lg object-cover shadow-xl"
              data-ai-hint="language learning abstract"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function MissionSection({ content }: { content: HomeContentType }) {
  const { language } = useLanguage();
  if (!content) return null;

  return (
    <section className="bg-secondary py-20 md:py-24">
      <div className="container mx-auto max-w-4xl px-6 text-center">
        <h2 className="font-headline text-3xl font-bold md:text-4xl">{content.missionTitle[language]}</h2>
        <p className="mt-4 text-lg text-secondary-foreground">{content.missionText[language]}</p>
      </div>
    </section>
  );
}

function ManifestoSection({ content }: { content: HomeContentType }) {
    const { language } = useLanguage();
    if (!content) return null;

    return (
        <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-7xl px-6">
                <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                    {/* Image: LTR -> order 1, RTL -> order 2 */}
                    <div className="flex justify-center md:order-1 rtl:md:order-2">
                         <Image
                            src="/images/home-manifesto.jpg"
                            alt={teachingImageAlts[language]}
                            width={500}
                            height={625}
                            className="rounded-lg object-cover shadow-xl"
                            data-ai-hint="library study"
                        />
                    </div>
                    {/* Text: LTR -> order 2, RTL -> order 1 */}
                    <div className="text-center md:text-left rtl:md:text-right md:order-2 rtl:md:order-1">
                        <h2 className="font-headline text-3xl font-bold md:text-4xl">{content.manifestoTitle[language]}</h2>
                        <p className="mt-4 text-lg text-muted-foreground">{content.manifestoText[language]}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}


function RecentPostsSection({ content, posts }: { content: HomeContentType, posts: Post[] }) {
  const { language } = useLanguage();

  if (!content || !posts) {
    return <div>Loading...</div>; // Or a proper skeleton loader
  }
  const recentPosts = posts.slice(0, 3);

  return (
    <section className="bg-secondary py-20 md:py-24">
      <div className="container mx-auto max-w-7xl px-6">
        <h2 className="text-center font-headline text-3xl font-bold md:text-4xl">{content.recentPostsTitle[language]}</h2>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 items-start">
          {recentPosts.map((post: Post) => (
            <Card key={post.slug} className="flex h-full flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <CardHeader className="p-0">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={post.imageUrl}
                    alt={post.title[language]}
                    fill
                    className="object-cover"
                    data-ai-hint={post.imageHint}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-6">
                <Badge variant="outline" className="mb-2 w-fit">{POST_CATEGORY_LABELS[post.category][language]}</Badge>
                <CardTitle className="font-headline text-xl">
                  <Link href={`/blog/${post.slug}`}>{post.title[language]}</Link>
                </CardTitle>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.excerpt[language]}</p>
              </CardContent>
              <CardFooter className="mt-auto p-6 pt-0">
                <Button asChild variant="link" className="p-0 font-semibold">
                  <Link href={`/blog/${post.slug}`}>
                    {content.readMore[language]} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToActionSection({ content }: { content: HomeContentType }) {
    const { language } = useLanguage();
    if (!content) return null;

    return (
        <section className="pt-20 md:pt-32 pb-0">
            <div className="container mx-auto max-w-4xl rounded-lg bg-primary p-12 text-center text-primary-foreground shadow-lg">
                <h2 className="font-headline text-3xl font-bold md:text-4xl">{content.ctaTitle[language]}</h2>
                <p className="mt-4 text-lg opacity-90">{content.ctaText[language]}</p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <Button asChild size="lg" variant="secondary" className="w-full font-semibold sm:w-auto">
                        <Link href="/classes">{content.ctaClasses[language]}</Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary" className="w-full font-semibold sm:w-auto">
                        <Link href="/classes/free-mitreden-workshop">{content.ctaFreeCourse[language]}</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
