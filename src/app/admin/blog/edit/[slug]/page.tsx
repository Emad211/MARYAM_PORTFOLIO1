
import { EditPostForm } from "@/components/admin/blog/edit-post-form";
import { getPosts } from "@/lib/cms-store";

export default async function EditPostPage({ params }: { params: { slug: string } }) {
  const posts = await getPosts();
  
  return <EditPostForm posts={posts} slug={params.slug} />;
}
