"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/theme-toggle"
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import type { Language } from "@/lib/types";

const headerContent: Record<Language, { backToSite: string; signOut: string; signedOutTitle: string; signedOutDescription: string }> = {
  en: {
    backToSite: "Back to Site",
    signOut: "Sign Out",
    signedOutTitle: "Signed Out",
    signedOutDescription: "You have been successfully signed out.",
  },
  de: {
    backToSite: "Zurück zur Website",
    signOut: "Abmelden",
    signedOutTitle: "Abgemeldet",
    signedOutDescription: "Sie wurden erfolgreich abgemeldet.",
  },
  fa: {
    backToSite: "بازگشت به سایت",
    signOut: "خروج",
    signedOutTitle: "خارج شدید",
    signedOutDescription: "با موفقیت از حساب خود خارج شدید.",
  },
};

export function Header() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { language } = useLanguage();
  const t = headerContent[language];

  const handleSignOut = () => {
    logout();
    toast({
      title: t.signedOutTitle,
      description: t.signedOutDescription,
    });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
       <div className="md:hidden">
          <SidebarTrigger />
       </div>
      <div className="flex-1">
        {/* Potentially add breadcrumbs or other context here */}
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
            <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                <span>{t.backToSite}</span>
            </Link>
        </Button>
        <ModeToggle />
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">{t.signOut}</span>
        </Button>
      </div>
    </header>
  )
}
