
import { ClassDetails } from "@/components/classes/class-details";
import { getClasses } from "@/lib/cms-store";

// This is now a Server Component
export default async function ClassDetailPage({ params }: { params: { slug: string } }) {
  // Fetch data on the server
  const classes = await getClasses();
  const { slug } = params;
  
  // Pass the fetched data and params as props to the client component
  return <ClassDetails classes={classes} slug={slug} />;
}
