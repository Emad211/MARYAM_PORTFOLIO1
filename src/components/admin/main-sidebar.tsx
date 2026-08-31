
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, GraduationCap, Settings, UploadCloud, MessageSquare, UserCheck, ClipboardCheck, ListChecks, Layers, BookOpen, MessageCircle, CalendarDays, CreditCard } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import type { Language } from "@/lib/types";

const sidebarLabels: Record<Language, { management: string; content: string; teaching: string; operations: string; system: string; dashboard: string; messages: string; enrollments: string; blog: string; classes: string; lms: string; grading: string; exams: string; vocab: string; grammar: string; chat: string; sessions: string; payments: string; deploy: string; settings: string }> = {
  en: { management: "Management", content: "Content", teaching: "Teaching", operations: "Operations", system: "System", dashboard: "Dashboard", messages: "Messages", enrollments: "Enrollments", blog: "Blog Posts", classes: "Classes", lms: "LMS Content", grading: "Grading Queue", exams: "Mock Exams", vocab: "Vocabulary", grammar: "Grammar Bank", chat: "Chat", sessions: "Sessions", payments: "Payments", deploy: "Deploy", settings: "Settings" },
  de: { management: "Verwaltung", content: "Inhalte", teaching: "Unterricht", operations: "Organisation", system: "System", dashboard: "Dashboard", messages: "Nachrichten", enrollments: "Anmeldungen", blog: "Blogbeiträge", classes: "Kurse", lms: "LMS-Inhalte", grading: "Bewertungen", exams: "Probetests", vocab: "Wortschatz", grammar: "Grammatik", chat: "Chat", sessions: "Termine", payments: "Zahlungen", deploy: "Deployment", settings: "Einstellungen" },
  fa: { management: "مدیریت", content: "محتوا", teaching: "آموزش", operations: "عملیات", system: "سیستم", dashboard: "داشبورد", messages: "پیام‌ها", enrollments: "ثبت‌نام‌ها", blog: "پست‌های وبلاگ", classes: "کلاس‌ها", lms: "محتوای LMS", grading: "صف تصحیح", exams: "آزمون‌های آزمایشی", vocab: "واژگان", grammar: "بانک گرامر", chat: "گفتگو", sessions: "جلسات", payments: "پرداخت‌ها", deploy: "استقرار", settings: "تنظیمات" },
};

export function MainSidebar() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const t = sidebarLabels[language];

  const menuGroups = [
    {
      label: t.management,
      items: [
        { href: "/admin", label: t.dashboard, icon: LayoutDashboard },
        { href: "/admin/registrations", label: t.enrollments, icon: UserCheck },
        { href: "/admin/messages", label: t.messages, icon: MessageSquare },
      ],
    },
    {
      label: t.content,
      items: [
        { href: "/admin/blog", label: t.blog, icon: FileText },
        { href: "/admin/classes", label: t.classes, icon: GraduationCap },
        { href: "/admin/lms", label: t.lms, icon: GraduationCap },
      ],
    },
    {
      label: t.teaching,
      items: [
        { href: "/admin/submissions", label: t.grading, icon: ClipboardCheck },
        { href: "/admin/exams", label: t.exams, icon: ListChecks },
        { href: "/admin/vocab", label: t.vocab, icon: Layers },
        { href: "/admin/grammar", label: t.grammar, icon: BookOpen },
      ],
    },
    {
      label: t.operations,
      items: [
        { href: "/admin/sessions", label: t.sessions, icon: CalendarDays },
        { href: "/admin/inbox", label: t.chat, icon: MessageCircle },
        { href: "/admin/payments", label: t.payments, icon: CreditCard },
      ],
    },
    {
      label: t.system,
      items: [
        { href: "/admin/deploy", label: t.deploy, icon: UploadCloud },
        { href: "/admin/settings", label: t.settings, icon: Settings },
      ],
    },
  ];

  return (
    <>
      <SidebarHeader>
        <nav aria-label="Admin navigation">
          <Link href="/admin" className="flex items-center gap-2">
             <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 20 H 50 V 35 H 35 V 80 H 20 Z" fill="hsl(var(--primary))" />
                <path d="M50 20 H 80 V 35 H 65 V 55 H 50 Z" fill="hsl(var(--accent))" />
                <path d="M35 55 L 65 55 L 65 80 L 35 80 Z" fill="hsl(var(--foreground))" className="dark:fill-[var(--background)]" opacity="0.8" />
             </svg>
             <span className="font-headline text-xl font-bold">Fluentia CMS</span>
           </Link>
        </nav>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href) && (item.href !== "/admin" || pathname === "/admin")}
                      className="w-full justify-start"
                      tooltip={item.label}
                    >
                      <item.icon className="h-5 w-5 me-2" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2">
      </SidebarFooter>
    </>
  )
}

