import { redirect } from 'next/navigation';
import { getRunnerData, getSessionInfo } from '@/app/actions/exam-actions';
import { ExamRunner } from '@/components/lms/exam-runner';

// Session state is per-student and time-sensitive — always dynamic.
export const dynamic = 'force-dynamic';

export default async function MockExamRunPage({
    params,
    searchParams,
}: {
    params: Promise<{ examId: string }>;
    searchParams: Promise<{ sid?: string }>;
}) {
    const { examId } = await params;
    const { sid } = await searchParams;

    if (!sid) redirect('/dashboard/exams');

    const info = await getSessionInfo(sid);
    // A session only qualifies when it exists, belongs to this exam, and is
    // still live — anything else sends the student back to the list.
    if (!info || info.status !== 'in_progress' || info.examId !== examId) {
        redirect('/dashboard/exams');
    }

    const data = await getRunnerData(examId);
    if (!data) redirect('/dashboard/exams');

    return <ExamRunner session={info} sections={data.sections} />;
}
