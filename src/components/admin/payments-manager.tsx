"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { EmptyState } from "@/components/admin/empty-state";
import {
    deletePayment,
    recordPayment,
    updatePaymentStatus,
} from "@/app/actions/payments-actions";
import type { PaymentRecord } from "@/lib/types";

interface StudentOption {
    userId: string;
    label: string;
}

type ActionResult = { success: boolean; message: string };

const inputClass =
    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm";

const ui = {
    en: {
        title: "Payments",
        subtitle: "Record tuition payments per student and confirm them (manual bookkeeping only).",
        count: (n: number) => `${n} payment${n === 1 ? "" : "s"} on file.`,
        record: "+ Record payment",
        closeForm: "Close form",
        newPayment: "New payment",
        student: "Student",
        amount: "Amount",
        currency: "Currency",
        method: "Method",
        status: "Status",
        classSlug: "Class (optional)",
        paidAt: "Paid at (optional)",
        periodStart: "Period start",
        periodEnd: "Period end",
        note: "Note",
        savePayment: "Save payment",
        methods: {
            bank_transfer: "Bank transfer",
            cash: "Cash",
            card: "Card",
            other: "Other",
        } as Record<string, string>,
        statuses: {
            pending: "Pending",
            confirmed: "Confirmed",
            failed: "Failed",
        } as Record<PaymentRecord["status"], string>,
        confirmAction: "Confirm",
        deleteAction: "Delete",
        confirmDelete: "Delete this payment record?",
        empty: "No payments recorded yet",
        emptySub: "Record the first payment with the “Record payment” button.",
        messages: {
            saved: "Payment recorded.",
            updated: "Payment updated.",
            deleted: "Payment deleted.",
            invalid_input: "Please check the form fields.",
            unauthorized: "You are not authorized.",
            save_failed: "Could not save the payment.",
            delete_failed: "Could not delete the payment.",
            done: "Done.",
        } as Record<string, string>,
    },
    de: {
        title: "Zahlungen",
        subtitle:
            "Erfassen Sie Studienzahlungen pro Student/in und bestätigen Sie diese (nur manuelle Buchführung).",
        count: (n: number) => `${n} Zahlung${n === 1 ? "" : "en"} erfasst.`,
        record: "+ Zahlung erfassen",
        closeForm: "Formular schließen",
        newPayment: "Neue Zahlung",
        student: "Student/in",
        amount: "Betrag",
        currency: "Währung",
        method: "Zahlungsart",
        status: "Status",
        classSlug: "Kurs (optional)",
        paidAt: "Zahlungsdatum (optional)",
        periodStart: "Zeitraum ab",
        periodEnd: "Zeitraum bis",
        note: "Notiz",
        savePayment: "Zahlung speichern",
        methods: {
            bank_transfer: "Überweisung",
            cash: "Barzahlung",
            card: "Kartenzahlung",
            other: "Sonstige",
        } as Record<string, string>,
        statuses: {
            pending: "Ausstehend",
            confirmed: "Bestätigt",
            failed: "Fehlgeschlagen",
        } as Record<PaymentRecord["status"], string>,
        confirmAction: "Bestätigen",
        deleteAction: "Löschen",
        confirmDelete: "Diesen Zahlungseintrag löschen?",
        empty: "Noch keine Zahlungen erfasst",
        emptySub: "Erfassen Sie die erste Zahlung mit der Schaltfläche „Zahlung erfassen“.",
        messages: {
            saved: "Zahlung erfasst.",
            updated: "Zahlung aktualisiert.",
            deleted: "Zahlung gelöscht.",
            invalid_input: "Bitte prüfen Sie die Formularfelder.",
            unauthorized: "Sie sind nicht berechtigt.",
            save_failed: "Die Zahlung konnte nicht gespeichert werden.",
            delete_failed: "Die Zahlung konnte nicht gelöscht werden.",
            done: "Erledigt.",
        } as Record<string, string>,
    },
    fa: {
        title: "پرداخت‌ها",
        subtitle: "ثبت پرداخت‌های شهریه هر هنرجو و تأیید آنها (فقط ثبت دستی).",
        count: (n: number) => `${n} پرداخت ثبت شده است.`,
        record: "+ ثبت پرداخت",
        closeForm: "بستن فرم",
        newPayment: "پرداخت جدید",
        student: "هنرجو",
        amount: "مبلغ",
        currency: "ارز",
        method: "روش پرداخت",
        status: "وضعیت",
        classSlug: "کلاس (اختیاری)",
        paidAt: "تاریخ پرداخت (اختیاری)",
        periodStart: "شروع بازه",
        periodEnd: "پایان بازه",
        note: "یادداشت",
        savePayment: "ثبت پرداخت",
        methods: {
            bank_transfer: "حواله بانکی",
            cash: "نقدی",
            card: "کارت",
            other: "سایر",
        } as Record<string, string>,
        statuses: {
            pending: "در انتظار",
            confirmed: "تأییدشده",
            failed: "ناموفق",
        } as Record<PaymentRecord["status"], string>,
        confirmAction: "تأیید",
        deleteAction: "حذف",
        confirmDelete: "این رکورد پرداخت حذف شود؟",
        empty: "هنوز پرداختی ثبت نشده",
        emptySub: "اولین پرداخت را با دکمهٔ «ثبت پرداخت» اضافه کنید.",
        messages: {
            saved: "پرداخت ثبت شد.",
            updated: "پرداخت به‌روزرسانی شد.",
            deleted: "پرداخت حذف شد.",
            invalid_input: "لطفاً فیلدهای فرم را بررسی کنید.",
            unauthorized: "اجازهٔ انجام این کار را ندارید.",
            save_failed: "ذخیرهٔ پرداخت ممکن نشد.",
            delete_failed: "حذف پرداخت ممکن نشد.",
            done: "انجام شد.",
        } as Record<string, string>,
    },
} as const;

export function PaymentsManager({
    initialPayments,
    students,
}: {
    initialPayments: Array<PaymentRecord & { studentName: string }>;
    students: StudentOption[];
}) {
    const router = useRouter();
    const { toast } = useToast();
    const { language } = useLanguage();
    const t = ui[language];
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const nameById = useMemo(
        () => new Map(students.map((s) => [s.userId, s.label.split(" (")[0]])),
        [students]
    );

    const report = (result: ActionResult) => {
        if (result.success) {
            toast({ description: t.messages[result.message] ?? t.messages.done });
        } else {
            toast({
                variant: "destructive",
                description: t.messages[result.message] ?? result.message,
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
        if (!window.confirm(t.confirmDelete)) return;
        startTransition(async () => {
            const fd = new FormData();
            fd.set("id", payment.id);
            const result = await deletePayment(fd);
            report(result);
            if (result.success) router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{t.count(initialPayments.length)}</p>
                    <Button size="sm" onClick={() => setShowForm((v) => !v)} disabled={isPending}>
                        {showForm ? t.closeForm : t.record}
                    </Button>
                </div>

                {showForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t.newPayment}</CardTitle>
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
                                    <Label htmlFor="pay-user">{t.student}</Label>
                                    <select id="pay-user" name="userId" required className={inputClass}>
                                        {students.map((s) => (
                                            <option key={s.userId} value={s.userId}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pay-amount">{t.amount}</Label>
                                    <Input id="pay-amount" name="amount" type="number" step="0.01" min="0.01" required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pay-currency">{t.currency}</Label>
                                    <select id="pay-currency" name="currency" defaultValue="EUR" className={inputClass}>
                                        <option value="EUR">EUR</option>
                                        <option value="USD">USD</option>
                                        <option value="IRR">IRR</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pay-method">{t.method}</Label>
                                    <select id="pay-method" name="method" defaultValue="bank_transfer" className={inputClass}>
                                        <option value="bank_transfer">{t.methods.bank_transfer}</option>
                                        <option value="cash">{t.methods.cash}</option>
                                        <option value="card">{t.methods.card}</option>
                                        <option value="other">{t.methods.other}</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pay-status">{t.status}</Label>
                                    <select id="pay-status" name="status" defaultValue="pending" className={inputClass}>
                                        <option value="pending">{t.statuses.pending}</option>
                                        <option value="confirmed">{t.statuses.confirmed}</option>
                                        <option value="failed">{t.statuses.failed}</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pay-class">{t.classSlug}</Label>
                                    <Input id="pay-class" name="classSlug" placeholder="a1-beginner-course" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pay-paidat">{t.paidAt}</Label>
                                    <Input id="pay-paidat" name="paidAtLocal" type="datetime-local" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pay-pstart">{t.periodStart}</Label>
                                    <Input id="pay-pstart" name="periodStart" type="date" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pay-pend">{t.periodEnd}</Label>
                                    <Input id="pay-pend" name="periodEnd" type="date" />
                                </div>
                                <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                                    <Label htmlFor="pay-note">{t.note}</Label>
                                    <Input id="pay-note" name="note" maxLength={500} />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-4">
                                    <Button type="submit" disabled={isPending}>
                                        {t.savePayment}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {initialPayments.length === 0 ? (
                    <EmptyState
                        icon={CreditCard}
                        en={ui.en.empty}
                        de={ui.de.empty}
                        fa={ui.fa.empty}
                        subEn={ui.en.emptySub}
                        subDe={ui.de.emptySub}
                        subFa={ui.fa.emptySub}
                    />
                ) : (
                    <Card>
                        <ul className="divide-y">
                            {initialPayments.map((payment) => (
                                <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                                    <div className="min-w-0 space-y-1">
                                        <p className="font-medium">
                                            {nameById.get(payment.userId) ?? payment.userId.slice(0, 8)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {payment.periodStart ?? "—"}
                                            {payment.periodEnd ? ` – ${payment.periodEnd}` : ""}
                                            {payment.classSlug ? ` · ${payment.classSlug}` : ""}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3">
                                        <span className="font-semibold tabular-nums">
                                            {payment.amount} {payment.currency}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={
                                                payment.status === "confirmed"
                                                    ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-400"
                                                    : payment.status === "pending"
                                                      ? "border-amber-500/60 text-amber-700 dark:text-amber-400"
                                                      : "border-destructive/40 text-muted-foreground"
                                            }
                                        >
                                            {t.statuses[payment.status]}
                                        </Badge>
                                        {payment.status === "pending" && (
                                            <Button size="sm" variant="outline" disabled={isPending} onClick={() => confirmPending(payment)}>
                                                {t.confirmAction}
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            disabled={isPending}
                                            onClick={() => remove(payment)}
                                        >
                                            {t.deleteAction}
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>
        </div>
    );
}
