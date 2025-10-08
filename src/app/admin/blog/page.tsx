
import { AdminBlogPageContent } from "@/components/admin/blog/admin-blog-page-content";
import { getPosts } from "@/lib/cms-store";

export default async function AdminBlogPage() {
  const posts = await getPosts();

  return <AdminBlogPageContent posts={posts} />;
}
