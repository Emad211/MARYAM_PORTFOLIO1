'use client';

import { useLanguage } from '@/context/language-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatLocalizedDate, formatLocalizedNumber } from '@/lib/label-utils';
import { cn } from '@/lib/utils';
import type { PaymentRecord, PaymentStatus } from '@/lib/types';

interface ContentShape {
    title: string;
    confirmedTotal: string;
    pendingCount: string;
    statusLabels: Record<PaymentStatus, string>;
    paidOn: string;
    noPeriod: string;
    emptyTitle: string;
    emptyBody: string;
}

const content: Record<'en' | 'de' | 'fa', ContentShape> = {
    en: {
        title: 'My payments',
        confirmedTotal: 'Confirmed total',
        pendingCount: 'Pending',
        statusLabels: {
            confirmed: 'Confirmed',
            pending: 'Pending',
            failed: 'Failed',
        },
        paidOn: 'Paid on',
        noPeriod: '—',
        emptyTitle: 'No payments recorded yet.',
        emptyBody: 'When your tuition payments are recorded, they will appear here.',
    },
    de: {
        title: 'Meine Zahlungen',
        confirmedTotal: 'Bestätigte Summe',
        pendingCount: 'Ausstehend',
        statusLabels: {
            confirmed: 'Bestätigt',
            pending: 'Ausstehend',
            failed: 'Fehlgeschlagen',
        },
        paidOn: 'Bezahlt am',
        noPeriod: '—',
        emptyTitle: 'Noch keine Zahlungen erfasst.',
        emptyBody: 'Sobald Ihre Kursgebühren erfasst wurden, erscheinen sie hier.',
    },
    fa: {
        title: 'پرداخت‌های من',
        confirmedTotal: 'جمع تأییدشده',
        pendingCount: 'در انتظار',
        statusLabels: {
            confirmed: 'تأیید شده',
            pending: 'در انتظار',
            failed: 'ناموفق',
        },
        paidOn: 'تاریخ پرداخت',
        noPeriod: '—',
        emptyTitle: 'هنوز پرداختی ثبت نشده است.',
        emptyBody: 'به‌محض ثبت شهریه شما، اینجا نمایش داده می‌شود.',
    },
};

const STATUS_BADGE: Record<PaymentRecord['status'], string> = {
    confirmed: 'border-emerald-500/60 text-emerald-700 dark:text-emerald-400',
    pending: 'border-amber-500/60 text-amber-700 dark:text-amber-400',
    failed: 'border-destructive/40 text-muted-foreground',
};

function periodText(
    payment: PaymentRecord,
    language: ReturnType<typeof useLanguage>['language'],
    noPeriod: string
): string {    const start = payment.periodStart ? formatLocalizedDate(payment.periodStart, language) : null;
    const end = payment.periodEnd ? formatLocalizedDate(payment.periodEnd, language) : null;
    if (start && end) return `${start} – ${end}`;
    return start ?? end ?? noPeriod;
}

export function PaymentsTable({ payments }: { payments: PaymentRecord[] }) {
    const { language } = useLanguage();
    const t = content[language];

    // Currency-aware confirmed total: EUR is the primary display currency;
    // any other currency keeps its own separate chip (never mixed into EUR).
    const confirmedByCurrency = new Map<PaymentRecord['currency'], number>();
    for (const payment of payments) {
        if (payment.status !== 'confirmed') continue;
        confirmedByCurrency.set(
            payment.currency,
            (confirmedByCurrency.get(payment.currency) ?? 0) + payment.amount
        );
    }
    const pendingCount = payments.filter((p) => p.status === 'pending').length;
    const eurTotal = confirmedByCurrency.get('EUR') ?? 0;
    const otherTotals = [...confirmedByCurrency.entries()].filter(([c]) => c !== 'EUR');

    if (payments.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                    <p className="text-lg font-medium">{t.emptyTitle}</p>
                    <p className="text-sm text-muted-foreground">{t.emptyBody}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>

            {/* Summary chips */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-lg border bg-card px-4 py-2">
                    <span className="text-xs text-muted-foreground">{t.confirmedTotal}</span>
                    <span className="ms-2 text-lg font-bold tabular-nums">
                        {formatLocalizedNumber(eurTotal, language)} EUR
                    </span>
                </div>
                {otherTotals.map(([currency, total]) => (
                    <Badge key={currency} variant="secondary" className="tabular-nums">
                        {formatLocalizedNumber(total, language)} {currency}
                    </Badge>
                ))}
                <Badge
                    variant={pendingCount > 0 ? 'outline' : 'secondary'}
                    className={cn(
                        'tabular-nums',
                        pendingCount > 0 &&
                            'border-amber-500/60 text-amber-700 dark:text-amber-400'
                    )}
                >
                    {t.pendingCount}: {formatLocalizedNumber(pendingCount, language)}
                </Badge>
            </div>

            {/* Payment rows */}
            <Card>
                <ul className="divide-y">
                    {payments.map((payment) => (
                        <li
                            key={payment.id}
                            className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                        >
                            <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {periodText(payment, language, t.noPeriod)}
                                    </span>
                                    {payment.classSlug && (
                                        <Badge variant="secondary" className="max-w-48 truncate">
                                            {payment.classSlug}
                                        </Badge>
                                    )}
                                </div>
                                {payment.paidAt && (
                                    <p className="text-xs text-muted-foreground">
                                        {t.paidOn}: {formatLocalizedDate(payment.paidAt, language)}
                                    </p>
                                )}
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                                <span className="font-semibold tabular-nums">
                                    {formatLocalizedNumber(payment.amount, language)}{' '}
                                    {payment.currency}
                                </span>
                                <Badge variant="outline" className={STATUS_BADGE[payment.status]}>
                                    {t.statusLabels[payment.status]}
                                </Badge>
                            </div>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
}
