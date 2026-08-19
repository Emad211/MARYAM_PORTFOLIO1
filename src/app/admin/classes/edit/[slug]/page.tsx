
import { EditClassForm } from "@/components/admin/classes/edit-class-form";
import { getClasses } from "@/lib/cms-store";

// Edit forms must load the current stored values, never a build-time snapshot.
// getClasses now uses the cookie-less anon client, so pin this route dynamic.
export const dynamic = 'force-dynamic';

export default async function EditClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const classes = await getClasses();
  const { slug } = await params;
  
  return <EditClassForm classes={classes} slug={slug} />;
}
