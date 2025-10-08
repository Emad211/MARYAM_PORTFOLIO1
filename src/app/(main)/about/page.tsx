
import { AboutContent } from "@/components/about/about-content";
import { getAboutContent, getTimeline } from "@/lib/cms-store";

// This is now a Server Component
export default async function AboutPage() {
  // Fetch data on the server
  const aboutContent = await getAboutContent();
  const timeline = await getTimeline();

  // Pass the fetched data as props to the client component
  return <AboutContent aboutContent={aboutContent} timeline={timeline} />;
}
