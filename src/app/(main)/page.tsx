
import { HomePageContent } from "@/components/home/home-page-content";
import { getHomeContent, getPosts } from "@/lib/cms-store";

// This is now a Server Component
export default async function HomePage() {
  // Fetch data on the server
  const homeContent = await getHomeContent();
  const posts = await getPosts();

  // Pass the fetched data as props to the client component
  return <HomePageContent homeContent={homeContent} posts={posts} />;
}
