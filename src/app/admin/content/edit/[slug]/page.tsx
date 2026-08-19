
import { EditContentForm } from "@/components/admin/content/edit-content-form";
import { getAboutContent, getContactContent, getHomeContent, getTimeline } from "@/lib/cms-store";

// Edit forms must load the current stored values, never a build-time snapshot.
// These getters now use the cookie-less anon client, so pin this route dynamic.
export const dynamic = 'force-dynamic';

export default async function EditContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch all possible content pieces on the server
  const homeContent = await getHomeContent();
  const aboutContent = await getAboutContent();
  const timeline = await getTimeline();
  const contactContent = await getContactContent();

  return (
    <EditContentForm
      slug={slug}
      homeContent={homeContent}
      aboutContent={aboutContent}
      timeline={timeline}
      contactContent={contactContent}
    />
  );
}
