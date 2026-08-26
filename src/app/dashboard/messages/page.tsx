import { getTeacherId } from '@/app/actions/messages-actions';
import { StudentChat } from '@/components/dashboard/student-chat';

// Live conversation — must reflect new messages immediately.
export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
    const teacherId = await getTeacherId();

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Chat with Maryam</h1>
            <StudentChat teacherId={teacherId} />
        </div>
    );
}
