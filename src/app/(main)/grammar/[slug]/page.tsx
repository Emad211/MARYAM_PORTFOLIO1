
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GrammarArticle } from "@/components/grammar/grammar-article";
import {
  getGrammarTopicBySlug,
  getGrammarTopics,
  getLessonsForTopic,
} from "@/lib/cms-store";

// ISR: cached per slug, regenerated on admin edit or hourly.
export const revalidate = 3600;

export async function generateStaticParams() {
  const topics = await getGrammarTopics();
  return topics.map((t) => ({ slug: t.slug }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fluentiaa.ir";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const topic = await getGrammarTopicBySlug(slug);
    if (!topic) return {};
    const description = topic.explanation.fa.slice(0, 160);
    return {
      title: topic.title.fa,
      description,
      alternates: { canonical: `/grammar/${topic.slug}` },
      openGraph: {
        title: topic.title.fa,
        description,
        url: `${SITE_URL}/grammar/${topic.slug}`,
        type: "article",
      },
    };
  } catch {
    return {};
  }
}

export default async function GrammarTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = await getGrammarTopicBySlug(slug);
  if (!topic) notFound();

  const lessons = await getLessonsForTopic(topic.id);

  return <GrammarArticle topic={topic} lessons={lessons} />;
}
