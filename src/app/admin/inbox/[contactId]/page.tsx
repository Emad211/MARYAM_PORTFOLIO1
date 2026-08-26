import { notFound } from 'next/navigation';
import { getTeacherId } from '@/app/actions/messages-actions';
import { listStudents } from '@/app/actions/payments-actions';
import { AdminChat } from '@/components/admin/admin-chat';

// Live thread view.
export const dynamic = 'force-dynamic';

export default async function AdminThreadPage({
    params,
}: {
    params: Promise<{ contactId: string }>;
}) {
    const { contactId } = await params;
    const [adminId, students] = await Promise.all([getTeacherId(), listStudents()]);

    if (!adminId) notFound();
    const student = students.find((s) => s.userId === contactId);
    if (!student) notFound();

    return (
        <AdminChat
            adminId={adminId}
            counterpartId={contactId}
            counterpartName={student.label.split(' (')[0] ?? student.label}
        />
    );
}
