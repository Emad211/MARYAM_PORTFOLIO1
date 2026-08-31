import { getAllPayments, listStudents } from '@/app/actions/payments-actions';
import { PaymentsManager } from '@/components/admin/payments-manager';

// Admin lists must always render live data, never a build-time snapshot.
// Route access itself is enforced by proxy.ts (admin role required).
export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
    const [initialPayments, students] = await Promise.all([getAllPayments(), listStudents()]);

    return <PaymentsManager initialPayments={initialPayments} students={students} />;
}
