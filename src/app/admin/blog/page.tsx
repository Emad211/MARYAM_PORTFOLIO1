
import { AdminBlogPageContent } from "@/components/admin/blog/admin-blog-page-content";
import { getPosts } from "@/lib/cms-store";

// Admin dashboards must always render live data. Public reads now go through the
// cookie-less anon client, so without this Next could statically prerender the
// page at build time and serve a stale list after an admin edit.
export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const posts = await getPosts();

  return <AdminBlogPageContent posts={posts} />;
}
