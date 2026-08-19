"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { approveEnrollment, rejectEnrollment } from "@/app/actions/enrollment-actions";
import type { AdminEnrollment } from "@/app/actions/enrollment-actions";
import type { Class, EnrollmentStatus } from "@/lib/types";

interface EnrollmentsDataTableProps {
  data: AdminEnrollment[];
  classes: Class[];
}

// Badge variant per status — same mapping used in the student dashboard.
const STATUS_VARIANT: Record<EnrollmentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  cancelled: "outline",
};

const tableContent = {
  en: {
    student: "Student",
    class: "Class",
    phone: "Phone",
    level: "Level",
    status: "Status",
    submitted: "Submitted",
    actions: "Actions",
    approve: "Approve",
    reject: "Reject",
    empty: "No enrollments yet.",
    detailsTitle: "Enrollment Details",
    name: "Name",
    email: "Email",
    goal: "Goal",
    motivation: "Motivation",
    noGoal: "No goal provided.",
    noMotivation: "No motivation provided.",
    statusLabels: {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      cancelled: "Cancelled",
    } as Record<EnrollmentStatus, string>,
    approveConfirmTitle: "Approve this enrollment?",
    approveConfirmBody: "The student will be enrolled. If this fills the class, it closes to new enrollments.",
    rejectConfirmTitle: "Reject this enrollment?",
    rejectConfirmBody: "The student's request will be declined. A freed seat re-opens a full class.",
    confirm: "Confirm",
    cancel: "Cancel",
    // toasts (keyed to server-action messages)
    approve_success: "Enrollment approved.",
    approve_failed: "Could not approve. Please try again.",
    reject_success: "Enrollment rejected.",
    reject_failed: "Could not reject. Please try again.",
    class_full: "This class is already full.",
    generic_error: "Something went wrong. Please try again.",
  },
  de: {
    student: "Student",
    class: "Klasse",
    phone: "Telefon",
    level: "Niveau",
    status: "Status",
    submitted: "Eingereicht",
    actions: "Aktionen",
    approve: "Annehmen",
    reject: "Ablehnen",
    empty: "Noch keine Anmeldungen.",
    detailsTitle: "Anmeldedetails",
    name: "Name",
    email: "Email",
    goal: "Ziel",
    motivation: "Motivation",
    noGoal: "Kein Ziel angegeben.",
    noMotivation: "Keine Motivation angegeben.",
    statusLabels: {
      pending: "Ausstehend",
      approved: "Angenommen",
      rejected: "Abgelehnt",
      cancelled: "Storniert",
    } as Record<EnrollmentStatus, string>,
    approveConfirmTitle: "Diese Anmeldung annehmen?",
    approveConfirmBody: "Der Student wird angemeldet. Wenn der Kurs damit voll ist, wird er für neue Anmeldungen geschlossen.",
    rejectConfirmTitle: "Diese Anmeldung ablehnen?",
    rejectConfirmBody: "Die Anfrage des Studenten wird abgelehnt. Ein frei gewordener Platz öffnet einen vollen Kurs wieder.",
    confirm: "Bestätigen",
    cancel: "Abbrechen",
    approve_success: "Anmeldung angenommen.",
    approve_failed: "Annahme fehlgeschlagen. Bitte erneut versuchen.",
    reject_success: "Anmeldung abgelehnt.",
    reject_failed: "Ablehnung fehlgeschlagen. Bitte erneut versuchen.",
    class_full: "Dieser Kurs ist bereits voll.",
    generic_error: "Etwas ist schiefgegangen. Bitte erneut versuchen.",
  },
  fa: {
    student: "دانشجو",
    class: "کلاس",
    phone: "تلفن",
    level: "سطح",
    status: "وضعیت",
    submitted: "تاریخ ثبت",
    actions: "عملیات",
    approve: "تأیید",
    reject: "رد",
    empty: "هنوز ثبت‌نامی وجود ندارد.",
    detailsTitle: "جزئیات ثبت‌نام",
    name: "نام",
    email: "ایمیل",
    goal: "هدف",
    motivation: "انگیزه",
    noGoal: "هدفی ارائه نشده است.",
    noMotivation: "انگیزه‌ای ارائه نشده است.",
    statusLabels: {
      pending: "در انتظار بررسی",
      approved: "تأیید شده",
      rejected: "رد شده",
      cancelled: "لغو شده",
    } as Record<EnrollmentStatus, string>,
    approveConfirmTitle: "این ثبت‌نام تأیید شود؟",
    approveConfirmBody: "دانشجو ثبت‌نام می‌شود. اگر با این کار ظرفیت کلاس تکمیل شود، کلاس برای ثبت‌نام جدید بسته می‌شود.",
    rejectConfirmTitle: "این ثبت‌نام رد شود؟",
    rejectConfirmBody: "درخواست دانشجو رد می‌شود. آزاد شدن یک جایگاه، کلاسِ پر را دوباره باز می‌کند.",
    confirm: "تأیید",
    cancel: "انصراف",
    approve_success: "ثبت‌نام تأیید شد.",
    approve_failed: "تأیید ممکن نشد. لطفاً دوباره تلاش کنید.",
    reject_success: "ثبت‌نام رد شد.",
    reject_failed: "رد کردن ممکن نشد. لطفاً دوباره تلاش کنید.",
    class_full: "ظرفیت این کلاس تکمیل است.",
    generic_error: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
  },
} as const;

type LangContent = (typeof tableContent)[keyof typeof tableContent];
const LOCALE: Record<"en" | "de" | "fa", string> = { en: "en-US", de: "de-DE", fa: "fa-IR" };

export function EnrollmentsDataTable({ data, classes }: EnrollmentsDataTableProps) {
  const { language } = useLanguage();
  const content = tableContent[language];
  const [selected, setSelected] = useState<AdminEnrollment | null>(null);

  // Resolve a class slug to its localized title (falls back to the slug).
  const titleFor = (slug: string) =>
    classes.find((c) => c.slug === slug)?.title[language] ?? slug;

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">{content.student}</TableHead>
                <TableHead>{content.class}</TableHead>
                <TableHead className="hidden md:table-cell">{content.level}</TableHead>
                <TableHead>{content.status}</TableHead>
                <TableHead className="hidden lg:table-cell">{content.submitted}</TableHead>
                <TableHead className="w-[180px] text-right">{content.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((enr) => (
                <TableRow
                  key={enr.id}
                  onClick={() => setSelected(enr)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="font-medium">{enr.studentName}</div>
                    <div className="text-xs text-muted-foreground">{enr.studentEmail}</div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/classes/${enr.classSlug}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge variant="outline" className="hover:bg-accent">
                        {titleFor(enr.classSlug)}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {enr.studentGermanLevel || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[enr.status]}>
                      {content.statusLabels[enr.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {new Date(enr.submittedAt).toLocaleDateString(LOCALE[language])}
                  </TableCell>
                  <TableCell className="text-right">
                    <EnrollmentActions enrollment={enr} content={content} />
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    {content.empty}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(isOpen) => !isOpen && setSelected(null)}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{content.detailsTitle}</DialogTitle>
            <DialogDescription>
              {selected ? titleFor(selected.classSlug) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 grid gap-4">
            <DetailRow label={content.name} value={selected?.studentName} />
            <DetailRow label={content.email} value={selected?.studentEmail} />
            <DetailRow label={content.phone} value={selected?.studentPhone || "N/A"} />
            <DetailRow label={content.level} value={selected?.studentGermanLevel || "N/A"} />
            <DetailRow label={content.status} value={selected ? content.statusLabels[selected.status] : ""} />
            <div className="grid grid-cols-[100px_1fr] items-start gap-4">
              <span className="text-sm font-semibold text-muted-foreground pt-1">{content.goal}</span>
              <p className="text-sm whitespace-pre-wrap">{selected?.learningGoal || content.noGoal}</p>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-start gap-4">
              <span className="text-sm font-semibold text-muted-foreground pt-1">{content.motivation}</span>
              <p className="text-sm whitespace-pre-wrap">{selected?.motivation || content.noMotivation}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

// Approve / Reject live only for a pending request. Each is behind a confirm
// dialog whose trigger stops row-click propagation (so the e2e stop-propagation
// check sees a dialog open, not a navigation — and no mutation on a stray click).
function EnrollmentActions({
  enrollment,
  content,
}: {
  enrollment: AdminEnrollment;
  content: LangContent;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  if (enrollment.status !== "pending") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const run = (
    action: () => Promise<{ success: boolean; message: string }>,
    successMsg: string,
    failedMsg: string
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast({ description: successMsg });
        router.refresh();
      } else {
        const msg = result.message === "class_full" ? content.class_full : failedMsg;
        toast({ variant: "destructive", description: msg });
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary hover:text-primary"
            disabled={isPending}
            onClick={(e) => e.stopPropagation()}
          >
            <Check className="h-4 w-4" />
            <span className="sr-only">{content.approve}</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{content.approveConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{content.approveConfirmBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{content.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                run(
                  () => approveEnrollment(enrollment.id, enrollment.classSlug),
                  content.approve_success,
                  content.approve_failed
                )
              }
            >
              {content.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            disabled={isPending}
            onClick={(e) => e.stopPropagation()}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{content.reject}</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{content.rejectConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{content.rejectConfirmBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{content.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                run(
                  () => rejectEnrollment(enrollment.id, enrollment.classSlug),
                  content.reject_success,
                  content.reject_failed
                )
              }
            >
              {content.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
