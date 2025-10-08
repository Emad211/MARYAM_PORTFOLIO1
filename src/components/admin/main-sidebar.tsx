
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, GraduationCap, Settings, UploadCloud, MessageSquare, UserCheck, Sparkles } from "lucide-react";

export function MainSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/messages", label: "Messages", icon: MessageSquare },
    { href: "/admin/registrations", label: "Registrations", icon: UserCheck },
    { href: "/admin/blog", label: "Blog Posts", icon: FileText },
    { href: "/admin/classes", label: "Classes", icon: GraduationCap },
    { href: "/admin/deploy", label: "Deploy", icon: UploadCloud },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];
  
  return (
    <>
      <SidebarHeader>
        <Link href="/admin" className="flex items-center gap-2">
           <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 20 H 50 V 35 H 35 V 80 H 20 Z" fill="hsl(var(--primary))" />
              <path d="M50 20 H 80 V 35 H 65 V 55 H 50 Z" fill="hsl(var(--accent))" />
              <path d="M35 55 L 65 55 L 65 80 L 35 80 Z" fill="hsl(var(--foreground))" className="dark:fill-hsl-var-background" opacity="0.8" />
           </svg>
          <span className="font-headline text-xl font-bold">Fluentia CMS</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                 <SidebarMenuButton
                  isActive={pathname.startsWith(item.href) && (item.href !== "/admin" || pathname === "/admin")}
                  className="w-full justify-start"
                  tooltip={{children: item.label}}
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
