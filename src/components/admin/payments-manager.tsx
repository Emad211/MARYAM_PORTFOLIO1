'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    deletePayment,
    recordPayment,
    updatePaymentStatus,
} from '@/app/actions/payments-actions';
import type { PaymentRecord } from '@/lib/types';

interface StudentOption {
    userId: string;
    label: string;
}

type ActionResult = { success: boolean; message: string };

const RESULT_MESSAGES: Record<string, string> = {
    saved: 'Payment recorded.',
    updated: 'Payment updated.',
    deleted: 'Payment deleted.',
    invalid_input: 'Please check the form fields.',
    unauthorized: 'You are not authorized.',
    save_failed: 'Could not save the payment.',
    delete_failed: 'Could not delete the payment.',
};

const inputClass =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm';

export function PaymentsManager({
    initialPayments,
    students,
}: {
    initialPayments: Array<PaymentRecord & { studentName: string }>;
    students: StudentOption[];
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const nameById = useMemo(
        () => new Map(students.map((s) => [s.userId, s.label.split(' (')[0]])),
        [students]
    );

    const report = (result: ActionResult) => {
        if (result.success) {
            toast({ description: RESULT_MESSAGES[result.message] ?? 'Done.' });
        } else {
            toast({
                variant: 'destructive',
                description: RESULT_MESSAGES[result.message] ?? result.message,
            });
        }
    };

    const handleRecord = (formData: FormData) => {
        startTransition(async () => {
            const result = await recordPayment(formData);
            report(result);
            if (result.success) {
                setShowForm(false);
                router.refresh();
            }
        });
    };

    const confirmPending = (payment: PaymentRecord) => {
        startTransition(async () => {
            const fd = new FormData();
            fd.set('id', payment.id);
            fd.set('status', 'confirmed');
            const now = new Date();
            fd.set(
                'paidAtLocal',
                `${now.toISOString().slice(0, 10)}T${now.toTimeString().slice(0, 5)}`
            );
            const result = await updatePaymentStatus(fd);
            report(result);
            if (result.success) router.refresh();
        });
    };

    const remove = (payment: PaymentRecord) => {
        if (!window.confirm('Delete this payment record?')) return;
        startTransition(async () => {
            const fd = new FormData();
            fd.set('id', payment.id);
            const result = await deletePayment(fd);
            report(result);
            if (result.success) router.refresh();
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {initialPayments.length} payment{initialPayments.length === 1 ? '' : 's'} on file.
                </p>
                <Button size="sm" onClick={() => setShowForm((v) => !v)} disabled={isPending}>
                    {showForm ? 'Close form' : '+ Record payment'}
                </Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">New payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleRecord(new FormData(e.currentTarget));
                            }}
                        >
                            <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor="pay-user">Student</Label>
                                <select id="pay-user" name="userId" required className={inputClass}>
                                    {students.map((s) => (
                                        <option key={s.userId} value={s.userId}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="pay-amount">Amount</Label>
                                <Input id="pay-amount" name="amount" type="number" step="0.01" min="0.01" required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="pay-currency">Currency</Label>
                                <select id="pay-currency" name="currency" defaultValue="EUR" className={inputClass}>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="IRR">IRR</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="pay-method">Method</Label>
                                <select id="pay-method" name="method" defaultValue="bank_transfer" className={inputClass}>
                                    <option value="bank_transfer">Bank transfer</option>
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="pay-status">Status</Label>
                                <select id="pay-status" name="status" defaultValue="pending" className={inputClass}>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="pay-class">Class slug (optional)</Label>
                                <Input id="pay-class" name="classSlug" placeholder="a1-beginner-course" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="pay-paidat">Paid at (optional)</Label>
                                <Input id="pay-paidat" name="paidAtLocal" type="datetime-local" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="pay-pstart">Period start</Label>
                                <Input id="pay-pstart" name="periodStart" type="date" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="pay-pend">Period end</Label>
                                <Input id="pay-pend" name="periodEnd" type="date" />
                            </div>
                            <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                                <Label htmlFor="pay-note">Note</Label>
                                <Input id="pay-note" name="note" maxLength={500} />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-4">
                                <Button type="submit" disabled={isPending}>
                                    Save payment
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <ul className="divide-y">
                    {initialPayments.length === 0 && (
                        <li className="px-6 py-8 text-center text-sm text-muted-foreground">
                            Nothing recorded yet.
                        </li>
                    )}
                    {initialPayments.map((payment) => (
                        <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                            <div className="min-w-0 space-y-1">
                                <p className="font-medium">
                                    {nameById.get(payment.userId) ?? payment.userId.slice(0, 8)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {payment.periodStart ?? '—'}
                                    {payment.periodEnd ? ` – ${payment.periodEnd}` : ''}
                                    {payment.classSlug ? ` · ${payment.classSlug}` : ''}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                                <span className="font-semibold tabular-nums">
                                    {payment.amount} {payment.currency}
                                </span>
                                <Badge
                                    variant="outline"
                                    className={
                                        payment.status === 'confirmed'
                                            ? 'border-emerald-500/60 text-emerald-700 dark:text-emerald-400'
                                            : payment.status === 'pending'
                                              ? 'border-amber-500/60 text-amber-700 dark:text-amber-400'
                                              : 'border-destructive/40 text-muted-foreground'
                                    }
                                >
                                    {payment.status}
                                </Badge>
                                {payment.status === 'pending' && (
                                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => confirmPending(payment)}>
                                        Confirm
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    disabled={isPending}
                                    onClick={() => remove(payment)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
}
