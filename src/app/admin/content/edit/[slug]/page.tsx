
import { EditContentForm } from "@/components/admin/content/edit-content-form";
import { getAboutContent, getContactContent, getHomeContent, getTimeline } from "@/lib/cms-store";

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
