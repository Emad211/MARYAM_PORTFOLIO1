'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
import { CheckCircle2, Clock } from 'lucide-react';
import { enrollInClass, cancelEnrollment } from '@/app/actions/enrollment-actions';
import type { Class, Enrollment } from '@/lib/types';

const content = {
    en: {
        heading: 'Enroll in this Class',
        // anonymous
        anonPrompt: 'Create an account or sign in to request a seat in this class.',
        signUp: 'Sign Up to Enroll',
        signIn: 'Already have an account? Sign in',
        // admin
        adminNote: "You're signed in as an administrator. Enrollment is for student accounts.",
        // enroll form
        goalLabel: 'Your main goal (optional)',
        goalPlaceholder: 'e.g., Prepare for the TestDaF exam',
        motivationLabel: 'A little about your motivation (optional)',
        motivationPlaceholder: 'e.g., I want to study at a German university...',
        enroll: 'Request Enrollment',
        enrolling: 'Submitting...',
        // unavailable
        unavailable: 'This class is not currently accepting enrollments.',
        // statuses
        pendingTitle: 'Enrollment pending review',
        pendingBody: 'Your request has been received. You will be notified once it is reviewed.',
        approvedTitle: "You're enrolled!",
        approvedBody: 'Your enrollment has been approved. Welcome to the class.',
        rejectedTitle: 'Enrollment not accepted',
        rejectedBody: 'Unfortunately this enrollment request was not accepted.',
        viewDashboard: 'View in my dashboard',
        cancel: 'Cancel request',
        cancelConfirmTitle: 'Cancel this enrollment?',
        cancelConfirmBody: 'This withdraws your request. You can enroll again later while seats remain.',
        cancelConfirmAction: 'Yes, cancel',
        cancelDismiss: 'Keep it',
        // toasts (keyed to server-action messages)
        enroll_success: 'Your enrollment request was submitted.',
        enroll_failed: 'Could not submit your enrollment. Please try again.',
        class_unavailable: 'This class is no longer accepting enrollments.',
        cancel_success: 'Your enrollment was cancelled.',
        cancel_failed: 'Could not cancel the enrollment. Please try again.',
        generic_error: 'Something went wrong. Please try again.',
    },
    de: {
        heading: 'Für diesen Kurs anmelden',
        anonPrompt: 'Erstellen Sie ein Konto oder melden Sie sich an, um einen Platz in diesem Kurs anzufragen.',
        signUp: 'Zum Anmelden registrieren',
        signIn: 'Sie haben bereits ein Konto? Anmelden',
        adminNote: 'Sie sind als Administrator angemeldet. Die Anmeldung ist für Studierendenkonten.',
        goalLabel: 'Ihr Hauptziel (optional)',
        goalPlaceholder: 'z.B. Vorbereitung auf die TestDaF-Prüfung',
        motivationLabel: 'Etwas über Ihre Motivation (optional)',
        motivationPlaceholder: 'z.B. Ich möchte an einer deutschen Universität studieren...',
        enroll: 'Anmeldung anfragen',
        enrolling: 'Wird gesendet...',
        unavailable: 'Dieser Kurs nimmt derzeit keine Anmeldungen an.',
        pendingTitle: 'Anmeldung in Prüfung',
        pendingBody: 'Ihre Anfrage ist eingegangen. Sie werden benachrichtigt, sobald sie geprüft wurde.',
        approvedTitle: 'Sie sind angemeldet!',
        approvedBody: 'Ihre Anmeldung wurde angenommen. Willkommen im Kurs.',
        rejectedTitle: 'Anmeldung nicht angenommen',
        rejectedBody: 'Diese Anmeldung wurde leider nicht angenommen.',
        viewDashboard: 'In meinem Dashboard ansehen',
        cancel: 'Anfrage stornieren',
        cancelConfirmTitle: 'Diese Anmeldung stornieren?',
        cancelConfirmBody: 'Damit ziehen Sie Ihre Anfrage zurück. Sie können sich später erneut anmelden, solange Plätze frei sind.',
        cancelConfirmAction: 'Ja, stornieren',
        cancelDismiss: 'Behalten',
        enroll_success: 'Ihre Anmeldeanfrage wurde gesendet.',
        enroll_failed: 'Ihre Anmeldung konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
        class_unavailable: 'Dieser Kurs nimmt keine Anmeldungen mehr an.',
        cancel_success: 'Ihre Anmeldung wurde storniert.',
        cancel_failed: 'Die Anmeldung konnte nicht storniert werden. Bitte versuchen Sie es erneut.',
        generic_error: 'Etwas ist schiefgegangen. Bitte versuchen Sie es erneut.',
    },
    fa: {
        heading: 'ثبت‌نام در این کلاس',
        anonPrompt: 'برای درخواست یک جایگاه در این کلاس، حساب کاربری بسازید یا وارد شوید.',
        signUp: 'برای ثبت‌نام حساب بسازید',
        signIn: 'قبلاً حساب دارید؟ وارد شوید',
        adminNote: 'شما به‌عنوان مدیر وارد شده‌اید. ثبت‌نام مخصوص حساب‌های دانشجویی است.',
        goalLabel: 'هدف اصلی شما (اختیاری)',
        goalPlaceholder: 'مثلا: آمادگی برای آزمون TestDaF',
        motivationLabel: 'کمی درباره انگیزه‌تان (اختیاری)',
        motivationPlaceholder: 'مثلا: می‌خواهم در یک دانشگاه آلمانی تحصیل کنم...',
        enroll: 'درخواست ثبت‌نام',
        enrolling: 'در حال ارسال...',
        unavailable: 'این کلاس در حال حاضر ثبت‌نام نمی‌پذیرد.',
        pendingTitle: 'ثبت‌نام در انتظار بررسی',
        pendingBody: 'درخواست شما دریافت شد. پس از بررسی به شما اطلاع داده می‌شود.',
        approvedTitle: 'ثبت‌نام شما تأیید شد!',
        approvedBody: 'ثبت‌نام شما تأیید شده است. به کلاس خوش آمدید.',
        rejectedTitle: 'ثبت‌نام پذیرفته نشد',
        rejectedBody: 'متأسفانه این درخواست ثبت‌نام پذیرفته نشد.',
        viewDashboard: 'مشاهده در داشبورد من',
        cancel: 'لغو درخواست',
        cancelConfirmTitle: 'این ثبت‌نام لغو شود؟',
        cancelConfirmBody: 'با این کار درخواست شما پس گرفته می‌شود. تا زمانی که ظرفیت باقی باشد می‌توانید دوباره ثبت‌نام کنید.',
        cancelConfirmAction: 'بله، لغو کن',
        cancelDismiss: 'بی‌خیال',
        enroll_success: 'درخواست ثبت‌نام شما ارسال شد.',
        enroll_failed: 'ارسال ثبت‌نام ممکن نشد. لطفاً دوباره تلاش کنید.',
        class_unavailable: 'این کلاس دیگر ثبت‌نام نمی‌پذیرد.',
        cancel_success: 'ثبت‌نام شما لغو شد.',
        cancel_failed: 'لغو ثبت‌نام ممکن نشد. لطفاً دوباره تلاش کنید.',
        generic_error: 'مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
    },
} as const;

type LangContent = (typeof content)[keyof typeof content];

/** A "live" enrollment occupies the student's slot for this class. Cancelled
 *  and rejected rows are not live — a cancelled one lets the student re-enroll;
 *  a rejected one is terminal (admin declined). */
function isLive(e: Enrollment | null): e is Enrollment {
    return e != null && (e.status === 'pending' || e.status === 'approved');
}

export function EnrollCta({
    classInfo,
    myEnrollment,
}: {
    classInfo: Class;
    myEnrollment: Enrollment | null;
}) {
    const { language } = useLanguage();
    const { user, loading } = useAuth();
    const t = content[language];
    const router = useRouter();

    // Seed from the server-provided enrollment and re-sync whenever the server
    // component refreshes (revalidatePath after enroll/cancel/admin decision).
    const [enrollment, setEnrollment] = useState<Enrollment | null>(myEnrollment);
    useEffect(() => {
        setEnrollment(myEnrollment);
    }, [myEnrollment]);

    if (loading) {
        return <Skeleton className="h-40 w-full" />;
    }

    const isStudent = user?.role === 'student';
    const isAdmin = user?.role === 'admin';

    // --- Anonymous: prompt to create an account / sign in --------------------
    if (!user) {
        return (
            <div className="space-y-4">
                <h3 className="font-headline text-2xl font-bold">{t.heading}</h3>
                <p className="text-sm text-muted-foreground">{t.anonPrompt}</p>
                <Button asChild className="w-full">
                    <Link href="/signup">{t.signUp}</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                    <Link href={`/login?redirect=/classes/${classInfo.slug}`}>{t.signIn}</Link>
                </Button>
            </div>
        );
    }

    // --- Admin: enrollment isn't for admins ----------------------------------
    if (isAdmin) {
        return <p className="text-sm text-muted-foreground">{t.adminNote}</p>;
    }

    // --- Student ------------------------------------------------------------
    if (isStudent && isLive(enrollment)) {
        return <EnrollmentStatusCard enrollment={enrollment} t={t} onCancelled={() =>
            setEnrollment((prev) => (prev ? { ...prev, status: 'cancelled' } : prev))
        } />;
    }

    if (isStudent && enrollment?.status === 'rejected') {
        return (
            <div className="space-y-3">
                <h3 className="font-headline text-2xl font-bold">{t.heading}</h3>
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    <p className="font-semibold text-destructive">{t.rejectedTitle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t.rejectedBody}</p>
                </div>
            </div>
        );
    }

    // Student with no live enrollment (never enrolled, or cancelled): allow
    // enrolling only while the class is active.
    if (classInfo.status !== 'active') {
        return (
            <div className="space-y-3">
                <h3 className="font-headline text-2xl font-bold">{t.heading}</h3>
                <p className="text-sm text-muted-foreground">{t.unavailable}</p>
            </div>
        );
    }

    return (
        <EnrollForm
            classSlug={classInfo.slug}
            t={t}
            onEnrolled={() => router.refresh()}
        />
    );
}

// ---------------------------------------------------------------------------

function EnrollForm({
    classSlug,
    t,
    onEnrolled,
}: {
    classSlug: string;
    t: LangContent;
    onEnrolled: () => void;
}) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [learningGoal, setLearningGoal] = useState('');
    const [motivation, setMotivation] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const formData = new FormData();
            formData.set('classSlug', classSlug);
            if (learningGoal.trim()) formData.set('learningGoal', learningGoal.trim());
            if (motivation.trim()) formData.set('motivation', motivation.trim());

            const result = await enrollInClass(formData);
            if (result.success) {
                toast({ description: t.enroll_success });
                onEnrolled();
            } else {
                // Map known keys to a localized message; fall back to generic.
                const msg =
                    result.message === 'class_unavailable'
                        ? t.class_unavailable
                        : result.message === 'enroll_failed'
                          ? t.enroll_failed
                          : t.generic_error;
                toast({ variant: 'destructive', description: msg });
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-headline text-2xl font-bold">{t.heading}</h3>
            <div className="space-y-2">
                <Label htmlFor="learningGoal">{t.goalLabel}</Label>
                <Textarea
                    id="learningGoal"
                    value={learningGoal}
                    onChange={(e) => setLearningGoal(e.target.value)}
                    placeholder={t.goalPlaceholder}
                    maxLength={2000}
                    rows={2}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="motivation">{t.motivationLabel}</Label>
                <Textarea
                    id="motivation"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder={t.motivationPlaceholder}
                    maxLength={2000}
                    rows={3}
                />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t.enrolling : t.enroll}
            </Button>
        </form>
    );
}

// ---------------------------------------------------------------------------

function EnrollmentStatusCard({
    enrollment,
    t,
    onCancelled,
}: {
    enrollment: Enrollment;
    t: LangContent;
    onCancelled: () => void;
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const approved = enrollment.status === 'approved';

    const handleCancel = () => {
        startTransition(async () => {
            const result = await cancelEnrollment(enrollment.id);
            if (result.success) {
                toast({ description: t.cancel_success });
                onCancelled();
                router.refresh();
            } else {
                toast({ variant: 'destructive', description: t.cancel_failed });
            }
        });
    };

    return (
        <div className="space-y-4">
            <h3 className="font-headline text-2xl font-bold">{t.heading}</h3>
            <div
                className={
                    approved
                        ? 'rounded-lg border border-primary/30 bg-primary/5 p-4'
                        : 'rounded-lg border bg-muted/50 p-4'
                }
            >
                <div className="flex items-start gap-3">
                    {approved ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    ) : (
                        <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    )}
                    <div>
                        <p className="font-semibold">
                            {approved ? t.approvedTitle : t.pendingTitle}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {approved ? t.approvedBody : t.pendingBody}
                        </p>
                    </div>
                    {!approved && (
                        <Badge variant="secondary" className="ml-auto">
                            {t.pendingTitle}
                        </Badge>
                    )}
                </div>
            </div>

            <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">{t.viewDashboard}</Link>
            </Button>

            {/* Only a pending request is the student's to withdraw here. */}
            {!approved && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="w-full" disabled={isPending}>
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
    );
}
