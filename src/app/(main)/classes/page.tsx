
import { ClassesPageContent } from "@/components/classes/classes-page-content";
import { getClasses } from "@/lib/cms-store";

// This is now a Server Component
export default async function ClassesPage() {
  // Fetch data on the server
  const classes = await getClasses();

  // Pass the fetched data as props to the client component
  return <ClassesPageContent classes={classes} />;
}
