import { getMyPayments } from '@/app/actions/payments-actions';
import { PaymentsTable } from '@/components/dashboard/payments-table';

// The history is RLS-scoped to the signed-in student and changes whenever
// Maryam records or confirms a payment — never prerendered or cached.
export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
    const payments = await getMyPayments();
    return <PaymentsTable payments={payments} />;
}
