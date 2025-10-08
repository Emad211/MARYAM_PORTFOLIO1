
import { EditClassForm } from "@/components/admin/classes/edit-class-form";
import { getClasses } from "@/lib/cms-store";

export default async function EditClassPage({ params }: { params: { slug: string } }) {
  const classes = await getClasses();
  
  return <EditClassForm classes={classes} slug={params.slug} />;
}
