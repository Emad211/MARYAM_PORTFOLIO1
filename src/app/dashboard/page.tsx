import { getMyEnrollments } from '@/app/actions/enrollment-actions';
import { getClassProgress } from '@/app/actions/lms-actions';
import { getVocabDashboard } from '@/app/actions/vocab-actions';
import { getClasses } from '@/lib/cms-store';
import { MyEnrollments } from '@/components/dashboard/my-enrollments';
import { VocabWidget } from '@/components/dashboard/vocab-widget';

// A student's home: the daily vocabulary habit widget above the list of
// classes they've enrolled in and each one's status. Enrollments are
// RLS-scoped to the caller; classes are public and used only to resolve
// slugs to localized titles. Curriculum progress is aggregated per class
// slug for the Continue-Learning block.
export default async function DashboardPage() {
    const [enrollments, classes, progressMap, vocabData] = await Promise.all([
        getMyEnrollments(),
        getClasses(),
        getClassProgress(),
        getVocabDashboard(),
    ]);

    return (
        <>
            <VocabWidget data={vocabData} />
            <MyEnrollments
                enrollments={enrollments}
                classes={classes}
                progressMap={progressMap}
            />
        </>
    );
}
