
import { ClassesPageContent } from "@/components/classes/classes-page-content";
import { getClasses } from "@/lib/cms-store";

// ISR: cached, regenerated on admin edit / enrollment status change
// (revalidatePath('/classes')) or hourly.
export const revalidate = 3600;

export default async function ClassesPage() {
  // Fetch data on the server
  const classes = await getClasses();

  // Pass the fetched data as props to the client component
  return <ClassesPageContent classes={classes} />;
}
