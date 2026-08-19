
import { BlogPost } from "@/components/blog/blog-post";
import { getPosts } from "@/lib/cms-store";

// ISR: cached per slug, regenerated on admin edit
// (revalidatePath('/blog/[slug]')) or hourly.
export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  // Fetch data on the server
  const posts = await getPosts();
  const { slug } = await params;

  // Pass the fetched data and params as props to the client component
  return <BlogPost posts={posts} slug={slug} />;
}
