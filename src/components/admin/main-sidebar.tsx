
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, GraduationCap, Settings, UploadCloud, MessageSquare, UserCheck } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import type { Language } from "@/lib/types";

const sidebarLabels: Record<Language, { dashboard: string; messages: string; enrollments: string; blog: string; classes: string; lms: string; deploy: string; settings: string }> = {
  en: { dashboard: "Dashboard", messages: "Messages", enrollments: "Enrollments", blog: "Blog Posts", classes: "Classes", lms: "LMS Content", deploy: "Deploy", settings: "Settings" },
  de: { dashboard: "Dashboard", messages: "Nachrichten", enrollments: "Anmeldungen", blog: "Blogbeiträge", classes: "Kurse", lms: "LMS-Inhalte", deploy: "Deployment", settings: "Einstellungen" },
  fa: { dashboard: "داشبورد", messages: "پیام‌ها", enrollments: "ثبت‌نام‌ها", blog: "پست‌های وبلاگ", classes: "کلاس‌ها", lms: "محتوای LMS", deploy: "استقرار", settings: "تنظیمات" },
};

export function MainSidebar() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const t = sidebarLabels[language];

  const menuItems = [
    { href: "/admin", label: t.dashboard, icon: LayoutDashboard },
    { href: "/admin/messages", label: t.messages, icon: MessageSquare },
    { href: "/admin/registrations", label: t.enrollments, icon: UserCheck },
    { href: "/admin/blog", label: t.blog, icon: FileText },
    { href: "/admin/classes", label: t.classes, icon: GraduationCap },
    { href: "/admin/lms", label: t.lms, icon: GraduationCap },
    { href: "/admin/deploy", label: t.deploy, icon: UploadCloud },
    { href: "/admin/settings", label: t.settings, icon: Settings },
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

      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                  <SidebarMenuButton
                  isActive={pathname.startsWith(item.href) && (item.href !== "/admin" || pathname === "/admin")}
                  className="w-full justify-start"
                  tooltip={item.label}
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  <span>{item.label}</span>
                 </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
      </SidebarFooter>
    </>
  )
}
