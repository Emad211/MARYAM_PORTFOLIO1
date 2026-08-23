
import { BlogPageContent } from "@/components/blog/blog-page-content";
import { getPosts } from "@/lib/cms-store";

// ISR: cached, regenerated on admin edit (revalidatePath('/blog')) or hourly.
export const revalidate = 3600;

export const metadata = {
  title: 'وبلاگ',
  description: 'مقالاتی درباره زبان، فرهنگ آلمان و نکات یادگیری مؤثر.',
  alternates: { canonical: '/blog' },
};

export default async function BlogPage() {
  // Fetch data on the server
  const posts = await getPosts();

  // Pass the fetched data as props to the client component
  return <BlogPageContent posts={posts} />;
}
