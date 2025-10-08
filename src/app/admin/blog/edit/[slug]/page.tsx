
import { EditPostForm } from "@/components/admin/blog/edit-post-form";
import { getPosts } from "@/lib/cms-store";

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const posts = await getPosts();
  const { slug } = await params;
  
  return <EditPostForm posts={posts} slug={slug} />;
}
