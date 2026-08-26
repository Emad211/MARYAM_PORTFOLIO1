import { getSessionHistory, listActiveMockExams } from '@/app/actions/exam-actions';
import { MockExamList } from '@/components/lms/mock-exam-list';

// Mock-exam availability and per-student history are session-scoped reads
// through the request-bound client — never prerendered.
export const dynamic = 'force-dynamic';

export default async function MockExamsPage() {
    const [exams, history] = await Promise.all([
        listActiveMockExams(),
        getSessionHistory(),
    ]);

    return <MockExamList exams={exams} history={history} />;
}
