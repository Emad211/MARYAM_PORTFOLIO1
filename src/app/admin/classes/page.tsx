
import { AdminClassesPageContent } from "@/components/admin/classes/admin-classes-page-content";
import { getClasses } from "@/lib/cms-store";

// Admin dashboards must always render live data. Public reads now go through the
// cookie-less anon client, so without this Next could statically prerender the
// page at build time and serve a stale list after an admin edit.
export const dynamic = 'force-dynamic';

export default async function AdminClassesPage() {
  const classes = await getClasses();

  return <AdminClassesPageContent classes={classes} />;
}
