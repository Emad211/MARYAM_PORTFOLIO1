import { notFound } from 'next/navigation';
import { CurriculumView } from '@/components/classes/curriculum-view';
import { getCurriculum, getStudentProgress } from '@/app/actions/lms-actions';
import { getClasses } from '@/lib/cms-store';

// Per-user progress + curriculum reads go through the request-bound client,
// so this page renders dynamically (never cached across students).
export const dynamic = 'force-dynamic';

export default async function CurriculumPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const [modules, progress, classes] = await Promise.all([
        getCurriculum(slug),
        getStudentProgress(),
        getClasses(),
    ]);

    const classInfo = classes.find((c) => c.slug === slug);
    if (!classInfo) {
        notFound();
    }

    return <CurriculumView classInfo={classInfo} modules={modules} progress={progress} />;
}
