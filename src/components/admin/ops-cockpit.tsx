
"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  MessageCircle,
  UserCheck,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";
import { getValidLocale } from "@/lib/type-utils";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/types";
import type { OpsOverview, OpsSession } from "@/app/actions/admin-ops-actions";

const cockpitContent: Record<
  Language,
  {
    greeting: string;
    kpiEnrollments: string;
    kpiSubmissions: string;
    kpiPayments: string;
    kpiMessages: string;
    newLabel: string;
    sessionsTitle: string;
    sessionsManage: string;
    sessionsEmpty: string;
    joinLink: string;
    analyticsHeading: string;
  }
> = {
  en: {
    greeting: "Hello Maryam 👋",
    kpiEnrollments: "Pending enrollments",
    kpiSubmissions: "Pending grading",
    kpiPayments: "Pending payments",
    kpiMessages: "Unread messages",
    newLabel: "new",
    sessionsTitle: "Upcoming sessions",
    sessionsManage: "Manage sessions",
    sessionsEmpty: "No upcoming sessions scheduled.",
    joinLink: "Join session",
    analyticsHeading: "Website analytics",
  },
  de: {
    greeting: "Hallo Maryam 👋",
    kpiEnrollments: "Anstehende Anmeldungen",
    kpiSubmissions: "Offene Korrekturen",
    kpiPayments: "Anstehende Zahlungen",
    kpiMessages: "Ungelesene Nachrichten",
    newLabel: "neu",
    sessionsTitle: "Anstehende Termine",
    sessionsManage: "Termine verwalten",
    sessionsEmpty: "Keine anstehenden Termine.",
    joinLink: "Teilnehmen",
    analyticsHeading: "Website-Statistiken",
  },
  fa: {
    greeting: "سلام مریم 👋",
    kpiEnrollments: "ثبت‌نام‌های در انتظار",
    kpiSubmissions: "در انتظار تصحیح",
    kpiPayments: "پرداخت‌های در انتظار",
    kpiMessages: "پیام‌های خوانده‌نشده",
    newLabel: "جدید",
    sessionsTitle: "جلسات پیش رو",
    sessionsManage: "مدیریت جلسات",
    sessionsEmpty: "جلسه‌ای در پیش رو نیست.",
    joinLink: "ورود به جلسه",
    analyticsHeading: "آمار بازدید سایت",
  },
};

interface KpiCardProps {
  href: string;
  label: string;
  count: number;
  icon: LucideIcon;
  newLabel: string;
}

function KpiCard({ href, label, count, icon: Icon, newLabel }: KpiCardProps) {
  const hasPending = count > 0;
  return (
    <Link
      href={href}
      className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-accent/30">
        <CardContent className="flex items-start justify-between gap-2 p-5">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{label}</p>
            <p
              className={cn(
                "mt-1 flex items-center gap-2 text-3xl font-bold tabular-nums",
                hasPending ? "text-primary" : "text-muted-foreground"
              )}
            >
              {count.toLocaleString()}
              {hasPending && (
                <>
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{newLabel}</span>
                </>
              )}
            </p>
          </div>
          <Icon className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
        </CardContent>
      </Card>
    </Link>
  );
}

function SessionItem({ session, joinLabel }: { session: OpsSession; joinLabel: string }) {
  const { language } = useLanguage();
  const locale = getValidLocale(language);
  const start = new Date(session.startsAt);

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
      <div className="w-36 shrink-0">
        <p className="text-sm font-medium">{format(start, "EEE d MMM", { locale })}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {format(start, "HH:mm", { locale })}
        </p>
      </div>
      <Badge variant="outline" className="max-w-[160px] shrink-0 truncate">
        {session.classSlug}
      </Badge>
      <span className="min-w-0 flex-1 truncate font-medium">{session.titleFa}</span>
      {session.meetingUrl && (
        <a
          href={session.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Video className="h-4 w-4" aria-hidden="true" />
          {joinLabel}
        </a>
      )}
    </li>
  );
}

/**
 * Teacher's daily-operations cockpit for the admin home page: greeting with
 * today's date, four pending-work KPI link cards, and the next five live
 * sessions. Website analytics render (untouched) below this block.
 */
export function OpsCockpit({ ops }: { ops: OpsOverview }) {
  const { language } = useLanguage();
  const t = cockpitContent[language];
  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: getValidLocale(language) });

  const kpis: Array<Omit<KpiCardProps, "newLabel">> = [
    {
      href: "/admin/registrations",
      label: t.kpiEnrollments,
      count: ops.pendingEnrollments,
      icon: UserCheck,
    },
    {
      href: "/admin/submissions",
      label: t.kpiSubmissions,
      count: ops.pendingSubmissions,
      icon: ClipboardCheck,
    },
    {
      href: "/admin/inbox",
      label: t.kpiMessages,
      count: ops.unreadMessages,
      icon: MessageCircle,
    },
    {
      href: "/admin/payments",
      label: t.kpiPayments,
      count: ops.pendingPayments,
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t.greeting}</h1>
        <p className="mt-1 text-muted-foreground" suppressHydrationWarning>
          {today}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.href} {...kpi} newLabel={t.newLabel} />
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{t.sessionsTitle}</h2>
          <Link
            href="/admin/sessions"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {t.sessionsManage}
          </Link>
        </div>
        {ops.nextSessions.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t.sessionsEmpty}
          </p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {ops.nextSessions.map((session) => (
                  <SessionItem key={session.id} session={session} joinLabel={t.joinLink} />
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

/** Demoted-section divider that sits between the cockpit and site analytics. */
export function AnalyticsSectionHeading() {
  const { language } = useLanguage();
  return (
    <div className="mt-2 border-t pt-8">
      <h2 className="text-xl font-semibold tracking-tight">
        {cockpitContent[language].analyticsHeading}
      </h2>
    </div>
  );
}
