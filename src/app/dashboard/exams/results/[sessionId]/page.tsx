import { notFound } from 'next/navigation';
import { getSessionHistory, getSessionResults } from '@/app/actions/exam-actions';
import { MockResults } from '@/components/lms/mock-results';

// Results are per-student and must reflect the just-finalized session.
export const dynamic = 'force-dynamic';

export default async function MockExamResultsPage({
    params,
}: {
    params: Promise<{ sessionId: string }>;
}) {
    const { sessionId } = await params;

    const [results, history] = await Promise.all([
        getSessionResults(sessionId),
        getSessionHistory(),
    ]);

    if (!results) notFound();

    return <MockResults results={results} history={history} />;
}
