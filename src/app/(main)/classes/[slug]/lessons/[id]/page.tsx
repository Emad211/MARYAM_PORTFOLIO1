import { notFound } from 'next/navigation';
import { LessonView } from '@/components/lms/lesson-view';
import {
    getLessonExercises,
    getLessonPage,
    getStudentProgress,
} from '@/app/actions/lms-actions';

// Lesson content is per-user gated (auth + progress), so this page renders
// dynamically. The gate itself resolves in the browser via <LessonGate>.
export const dynamic = 'force-dynamic';

export default async function LessonPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>;
}) {
    const { slug, id } = await params;
    const [lessonPage, exercises, progress] = await Promise.all([
        getLessonPage(id),
        getLessonExercises(id),
        getStudentProgress(),
    ]);

    // Unknown lesson id — or a lesson that belongs to a different class than
    // the URL claims — is a 404.
    if (!lessonPage || lessonPage.classSlug !== slug) {
        notFound();
    }

    return (
        <LessonView
            lesson={lessonPage.lesson}
            moduleTitle={lessonPage.moduleTitle}
            classSlug={lessonPage.classSlug}
            exercises={exercises}
            initialDone={Boolean(progress[id])}
        />
    );
}
