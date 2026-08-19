
import { HomePageContent } from "@/components/home/home-page-content";
import { getHomeContent, getPosts } from "@/lib/cms-store";

// ISR: render once, serve from cache, regenerate on admin edit (revalidatePath)
// or hourly as a safety net. Content is identical for every visitor.
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch data on the server
  const homeContent = await getHomeContent();
  const posts = await getPosts();

  // Pass the fetched data as props to the client component
  return <HomePageContent homeContent={homeContent} posts={posts} />;
}
