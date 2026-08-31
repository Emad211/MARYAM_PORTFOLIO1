
import { getClasses } from "@/lib/cms-store";
import { LmsClassList } from "@/components/admin/lms-class-list";

// Admin dashboards must always render live data, never a build-time snapshot.
export const dynamic = 'force-dynamic';

export default async function AdminLmsPage() {
  const classes = await getClasses();

  return <LmsClassList classes={classes} />;
}
