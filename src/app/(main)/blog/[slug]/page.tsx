
import { BlogPost } from "@/components/blog/blog-post";
import { getPosts } from "@/lib/cms-store";

// This is now a Server Component
export default async function PostPage({ params }: { params: { slug: string } }) {
  // Fetch data on the server
  const posts = await getPosts();
  const { slug } = params;

  // Pass the fetched data and params as props to the client component
  return <BlogPost posts={posts} slug={slug} />;
}
