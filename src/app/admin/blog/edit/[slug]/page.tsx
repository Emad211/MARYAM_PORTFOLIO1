
import { EditPostForm } from "@/components/admin/blog/edit-post-form";
import { getPosts } from "@/lib/cms-store";

// Edit forms must load the current stored values, never a build-time snapshot.
// getPosts now uses the cookie-less anon client, so pin this route dynamic.
export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const posts = await getPosts();
  const { slug } = await params;
  
  return <EditPostForm posts={posts} slug={slug} />;
}
