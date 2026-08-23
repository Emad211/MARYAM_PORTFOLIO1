'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cancelEnrollment } from '@/app/actions/enrollment-actions';
import type {
    Class,
    ClassProgress,
    Enrollment,
    EnrollmentStatus,
    Language,
} from '@/lib/types';

const content = {
    en: {
        title: 'My Enrollments',
        subtitle: 'Track the status of your class enrollments.',
        empty: "You haven't enrolled in any classes yet.",
        browse: 'Browse Classes',
        continueTitle: 'Continue Learning',
        continue: 'Continue',
        lessonsProgress: '{done} of {total} lessons',
        enrolledOn: 'Enrolled',
        cancel: 'Cancel Enrollment',
        cancelConfirmTitle: 'Cancel this enrollment?',
        cancelConfirmBody: 'This will withdraw your enrollment request. You can enroll again later while seats remain.',
        cancelConfirmAction: 'Yes, cancel',
        cancelDismiss: 'Keep it',
        cancelSuccess: 'Your enrollment was cancelled.',
        cancelError: 'Could not cancel the enrollment. Please try again.',
        status: {
            pending: 'Pending review',
            approved: 'Approved',
            rejected: 'Not accepted',
            cancelled: 'Cancelled',
        } as Record<EnrollmentStatus, string>,
    },
    de: {
        title: 'Meine Anmeldungen',
        subtitle: 'Verfolgen Sie den Status Ihrer Kursanmeldungen.',
        empty: 'Sie haben sich noch für keine Kurse angemeldet.',
        browse: 'Kurse ansehen',
        continueTitle: 'Weiterlernen',
        continue: 'Fortsetzen',
        lessonsProgress: '{done} von {total} Lektionen',
        enrolledOn: 'Angemeldet',
        cancel: 'Anmeldung stornieren',
        cancelConfirmTitle: 'Diese Anmeldung stornieren?',
        cancelConfirmBody: 'Damit ziehen Sie Ihre Anmeldung zurück. Sie können sich später erneut anmelden, solange Plätze frei sind.',
        cancelConfirmAction: 'Ja, stornieren',
        cancelDismiss: 'Behalten',
        cancelSuccess: 'Ihre Anmeldung wurde storniert.',
        cancelError: 'Die Anmeldung konnte nicht storniert werden. Bitte versuchen Sie es erneut.',
        status: {
            pending: 'In Prüfung',
            approved: 'Angenommen',
            rejected: 'Nicht angenommen',
            cancelled: 'Storniert',
        } as Record<EnrollmentStatus, string>,
    },
    fa: {
        title: 'ثبت‌نام‌های من',
        subtitle: 'وضعیت ثبت‌نام‌های خود در کلاس‌ها را دنبال کنید.',
        empty: 'هنوز در هیچ کلاسی ثبت‌نام نکرده‌اید.',
        browse: 'مشاهده کلاس‌ها',
        continueTitle: 'ادامه یادگیری',
        continue: 'ادامه',
        lessonsProgress: '{done} از {total} درس',
        enrolledOn: 'تاریخ ثبت‌نام',
        cancel: 'لغو ثبت‌نام',
        cancelConfirmTitle: 'این ثبت‌نام لغو شود؟',
        cancelConfirmBody: 'با این کار درخواست ثبت‌نام شما پس گرفته می‌شود. تا زمانی که ظرفیت باقی باشد می‌توانید دوباره ثبت‌نام کنید.',
        cancelConfirmAction: 'بله، لغو کن',
        cancelDismiss: 'بی‌خیال',
        cancelSuccess: 'ثبت‌نام شما لغو شد.',
        cancelError: 'لغو ثبت‌نام ممکن نشد. لطفاً دوباره تلاش کنید.',
        status: {
            pending: 'در انتظار بررسی',
            approved: 'تأیید شده',
            rejected: 'پذیرفته نشد',
            cancelled: 'لغو شده',
        } as Record<EnrollmentStatus, string>,
    },
} as const;

// Map each status to a Badge variant. `approved` uses the default (primary)
// accent; terminal/negative states are muted or destructive.
const STATUS_VARIANT: Record<EnrollmentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    cancelled: 'outline',
};

function EnrollmentCard({
    enrollment,
    className,
    language,
    onCancelled,
}: {
    enrollment: Enrollment;
    className: string;
    language: Language;
    onCancelled: () => void;
}) {
    const t = content[language];
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Only a live (pending) request is the student's to withdraw. Approved
    // seats and terminal states (rejected/cancelled) are not cancellable here.
    const canCancel = enrollment.status === 'pending';

    const submittedDate = new Date(enrollment.submittedAt).toLocaleDateString(
        language === 'fa' ? 'fa-IR' : language === 'de' ? 'de-DE' : 'en-US'
    );

    const handleCancel = () => {
        startTransition(async () => {
            const result = await cancelEnrollment(enrollment.id);
            if (result.success) {
                toast({ description: t.cancelSuccess });
                onCancelled();
            } else {
                toast({ variant: 'destructive', description: t.cancelError });
            }
        });
    };

    return (
        <Card>
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h3 className="font-headline text-lg font-semibold">{className}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t.enrolledOn}: {submittedDate}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={STATUS_VARIANT[enrollment.status]}>
                        {t.status[enrollment.status]}
                    </Badge>
                    {canCancel && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={isPending}>
                                    {t.cancel}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t.cancelConfirmTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>{t.cancelConfirmBody}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t.cancelDismiss}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleCancel}>
                                        {t.cancelConfirmAction}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function MyEnrollments({
    enrollments: initialEnrollments,
    classes,
    progressMap,
}: {
    enrollments: Enrollment[];
    classes: Class[];
    progressMap: Record<string, ClassProgress>;
}) {
    const { language } = useLanguage();
    const t = content[language];
    // Optimistically drop a cancelled row so the list reflects the action
    // without waiting for a full navigation/refresh.
    const [enrollments, setEnrollments] = useState(initialEnrollments);

    const titleFor = (slug: string): string => {
        const cls = classes.find((c) => c.slug === slug);
        return cls ? cls.title[language] : slug;
    };

    // Continue-Learning candidates: approved seats that actually have
    // curriculum progress to resume. `noUncheckedIndexedAccess` makes the
    // lookup `ClassProgress | undefined`, so the guard doubles as the filter.
    const continueRows = enrollments
        .filter((e) => e.status === 'approved')
        .map((e) => ({ slug: e.classSlug, progress: progressMap[e.classSlug] }))
        .filter(
            (row): row is { slug: string; progress: ClassProgress } =>
                row.progress !== undefined && row.progress.total > 0
        );

    const formatNumber = (n: number): string =>
        n.toLocaleString(language === 'fa' ? 'fa-IR' : language === 'de' ? 'de-DE' : 'en-US');

    const lessonsCaption = (done: number, total: number): string =>
        t.lessonsProgress.replace('{done}', formatNumber(done)).replace('{total}', formatNumber(total));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            {continueRows.length > 0 && (
                <section aria-labelledby="continue-learning-heading" className="space-y-3">
                    <h2 id="continue-learning-heading" className="text-xl font-semibold">
                        {t.continueTitle}
                    </h2>
                    <div className="space-y-3">
                        {continueRows.map(({ slug, progress }) => (
                            <Card key={slug}>
                                <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="w-full space-y-2 sm:max-w-md">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <h3 className="font-headline text-lg font-semibold">
                                                {titleFor(slug)}
                                            </h3>
                                            <span className="shrink-0 text-sm text-muted-foreground">
                                                {lessonsCaption(progress.done, progress.total)}
                                            </span>
                                        </div>
                                        <Progress
                                            value={Math.round((progress.done / progress.total) * 100)}
                                            className="h-2"
                                            aria-label={titleFor(slug)}
                                        />
                                    </div>
                                    <Button asChild size="sm" className="shrink-0 self-start sm:self-auto">
                                        <Link href={`/classes/${slug}/curriculum`}>{t.continue}</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {enrollments.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-normal text-muted-foreground">
                            {t.empty}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/classes">{t.browse}</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {enrollments.map((enrollment) => (
                        <EnrollmentCard
                            key={enrollment.id}
                            enrollment={enrollment}
                            className={titleFor(enrollment.classSlug)}
                            language={language}
                            onCancelled={() =>
                                setEnrollments((prev) =>
                                    prev.map((e) =>
                                        e.id === enrollment.id ? { ...e, status: 'cancelled' } : e
                                    )
                                )
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
