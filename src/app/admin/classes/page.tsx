
import { AdminClassesPageContent } from "@/components/admin/classes/admin-classes-page-content";
import { getClasses } from "@/lib/cms-store";

export default async function AdminClassesPage() {
  const classes = await getClasses();

  return <AdminClassesPageContent classes={classes} />;
}
