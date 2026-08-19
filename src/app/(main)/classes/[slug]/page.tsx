
import { ClassDetails } from "@/components/classes/class-details";
import { getClasses } from "@/lib/cms-store";

// Fully public/cacheable: only the class content (identical for every visitor)
// is fetched on the server. The signed-in student's own enrollment state is
// per-user, so it's fetched client-side inside <EnrollCta> — keeping this page
// out of dynamic rendering. Regenerates on admin edit (revalidatePath) plus a
// time-based safety net.
export const revalidate = 3600;

export async function generateStaticParams() {
  const classes = await getClasses();
  return classes.map((c) => ({ slug: c.slug }));
}

export default async function ClassDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const classes = await getClasses();

  return <ClassDetails classes={classes} slug={slug} />;
}
