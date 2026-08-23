
import { AboutContent } from "@/components/about/about-content";
import { getAboutContent, getTimeline } from "@/lib/cms-store";

// ISR: cached, regenerated on admin edit (revalidatePath('/about')) or hourly.
export const revalidate = 3600;

export const metadata = {
  title: 'درباره من | مدرس زبان آلمانی',
  description: 'داستان مسیر، صلاحیت‌ها و تجربه تدریس مدرس و ممتاز آزمون TestDaF.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  // Fetch data on the server
  const aboutContent = await getAboutContent();
  const timeline = await getTimeline();

  // Pass the fetched data as props to the client component
  return <AboutContent aboutContent={aboutContent} timeline={timeline} />;
}
