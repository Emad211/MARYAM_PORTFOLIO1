import { getMyEnrollments } from '@/app/actions/enrollment-actions';
import { getClasses } from '@/lib/cms-store';
import { MyEnrollments } from '@/components/dashboard/my-enrollments';

// A student's home: the list of classes they've enrolled in and each one's
// status. Enrollments are RLS-scoped to the caller; classes are public and
// used only to resolve slugs to localized titles.
export default async function DashboardPage() {
    const [enrollments, classes] = await Promise.all([getMyEnrollments(), getClasses()]);

    return <MyEnrollments enrollments={enrollments} classes={classes} />;
}
