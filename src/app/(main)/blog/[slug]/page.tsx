
import type { Metadata } from "next";
import { BlogPost } from "@/components/blog/blog-post";
import { getPosts } from "@/lib/cms-store";

// ISR: cached per slug, regenerated on admin edit
// (revalidatePath('/blog/[slug]')) or hourly.
export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fluentiaa.ir";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = (await getPosts()).find((p) => p.slug === slug);
    if (!post) return {};
    return {
      title: post.title.fa,
      description: post.excerpt.fa,
      alternates: { canonical: `/blog/${post.slug}` },
      openGraph: {
        title: post.title.fa,
        description: post.excerpt.fa,
        url: `${SITE_URL}/blog/${post.slug}`,
        type: "article",
        publishedTime: new Date(post.date).toISOString(),
        images: [{ url: post.imageUrl }],
      },
    };
  } catch {
    return {};
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  // Fetch data on the server
  const posts = await getPosts();
  const { slug } = await params;

  // Pass the fetched data and params as props to the client component
  return <BlogPost posts={posts} slug={slug} />;
}
