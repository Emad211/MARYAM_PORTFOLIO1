
import { ClassDetails } from "@/components/classes/class-details";
import { getClasses } from "@/lib/cms-store";
import { getMyEnrollments } from "@/app/actions/enrollment-actions";

// This is now a Server Component
export default async function ClassDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch classes (public) and the caller's own enrollments (RLS-scoped —
  // empty for anonymous visitors and admins) in parallel. The student's
  // enrollment for THIS class, if any, drives the enroll CTA's state.
  const [classes, myEnrollments] = await Promise.all([getClasses(), getMyEnrollments()]);
  const myEnrollment = myEnrollments.find((e) => e.classSlug === slug) ?? null;

  // Pass the fetched data and params as props to the client component
  return <ClassDetails classes={classes} slug={slug} myEnrollment={myEnrollment} />;
}
