import { getMyEnrollments } from '@/app/actions/enrollment-actions';
import { getClassProgress, getCurriculum } from '@/app/actions/lms-actions';
import { getVocabDashboard } from '@/app/actions/vocab-actions';
import { getMyHomework } from '@/app/actions/homework-actions';
import { getClasses } from '@/lib/cms-store';
import { MyEnrollments } from '@/components/dashboard/my-enrollments';
import { VocabWidget } from '@/components/dashboard/vocab-widget';
import { HomeworkList } from '@/components/dashboard/homework-list';

// A student's home: upcoming homework with due dates above the daily
// vocabulary habit widget, then enrolled classes with per-class progress.
export default async function DashboardPage() {
    const [enrollments, classes, progressMap, vocabData, homework] = await Promise.all([
        getMyEnrollments(),
        getClasses(),
        getClassProgress(),
        getVocabDashboard(),
        getMyHomework(),
    ]);

    // Resolve each homework lesson to its class slug for the lesson link.
    const lessonSlug: Record<string, string> = {};
    const approvedSlugs = [
        ...new Set(enrollments.filter((e) => e.status === 'approved').map((e) => e.classSlug)),
    ];
    const curricula = await Promise.all(approvedSlugs.map((slug) => getCurriculum(slug)));
    curricula.forEach((modules, i) => {
        const slug = approvedSlugs[i];
        if (!slug) return;
        for (const m of modules) for (const l of m.lessons) lessonSlug[l.id] = slug;
    });

    return (
        <>
            <HomeworkList items={homework} lessonSlug={lessonSlug} />
            <VocabWidget data={vocabData} />
            <MyEnrollments
                enrollments={enrollments}
                classes={classes}
                progressMap={progressMap}
            />
        </>
    );
}
