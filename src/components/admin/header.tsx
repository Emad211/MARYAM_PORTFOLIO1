"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/theme-toggle"
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function Header() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
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
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Site</span>
            </Link>
        </Button>
        <ModeToggle />
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Sign Out</span>
        </Button>
      </div>
    </header>
  )
}
