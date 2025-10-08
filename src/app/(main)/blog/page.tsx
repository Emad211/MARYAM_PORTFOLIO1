
import { BlogPageContent } from "@/components/blog/blog-page-content";
import { getPosts } from "@/lib/cms-store";

// This is now a Server Component
export default async function BlogPage() {
  // Fetch data on the server
  const posts = await getPosts();

  // Pass the fetched data as props to the client component
  return <BlogPageContent posts={posts} />;
}
