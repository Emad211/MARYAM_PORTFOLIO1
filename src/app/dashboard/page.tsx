import { getMyEnrollments } from '@/app/actions/enrollment-actions';
import { getClassProgress } from '@/app/actions/lms-actions';
import { getClasses } from '@/lib/cms-store';
import { MyEnrollments } from '@/components/dashboard/my-enrollments';

// A student's home: the list of classes they've enrolled in and each one's
// status. Enrollments are RLS-scoped to the caller; classes are public and
// used only to resolve slugs to localized titles. Curriculum progress is
// aggregated per class slug for the Continue-Learning block.
export default async function DashboardPage() {
    const [enrollments, classes, progressMap] = await Promise.all([
        getMyEnrollments(),
        getClasses(),
        getClassProgress(),
    ]);

    return (
        <MyEnrollments
            enrollments={enrollments}
            classes={classes}
            progressMap={progressMap}
        />
    );
}
