import { getAllPayments, listStudents } from '@/app/actions/payments-actions';
import { PaymentsManager } from '@/components/admin/payments-manager';

// Admin lists must always render live data, never a build-time snapshot.
// Route access itself is enforced by proxy.ts (admin role required).
export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
    const [initialPayments, students] = await Promise.all([getAllPayments(), listStudents()]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
                <p className="text-muted-foreground">
                    Record tuition payments per student and confirm them (manual bookkeeping only).
                </p>
            </div>

            <PaymentsManager initialPayments={initialPayments} students={students} />
        </div>
    );
}
