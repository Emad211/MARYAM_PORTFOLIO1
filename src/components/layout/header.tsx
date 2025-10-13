
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { useLanguage } from "@/context/language-context";
import { ModeToggle } from "../theme-toggle";

const navLinks = {
  en: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/classes", label: "Classes" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ],
  de: [
    { href: "/", label: "Startseite" },
    { href: "/about", label: "Über mich" },
    { href: "/classes", label: "Kurse" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Kontakt" },
  ],
  fa: [
    { href: "/", label: "خانه" },
    { href: "/about", label: "درباره من" },
    { href: "/classes", label: "کلاس‌ها" },
    { href: "/blog", label: "بلاگ" },
    { href: "/contact", label: "تماس" },
  ],
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 20 H 50 V 35 H 35 V 80 H 20 Z" fill="hsl(var(--primary))" />
        <path d="M50 20 H 80 V 35 H 65 V 55 H 50 Z" fill="hsl(var(--accent))" />
            <path d="M35 55 L 65 55 L 65 80 L 35 80 Z" fill="hsl(var(--foreground))" className="dark:fill-[var(--background)]" opacity="0.8" />
      </svg>
      <span className="font-headline text-2xl font-bold text-foreground">
        Fluentia
      </span>
    </Link>
  )
}


export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const links = navLinks[language];

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className={cn(
        "text-foreground/80 transition-colors hover:text-foreground",
        pathname === href && "font-semibold text-primary"
      )}
      onClick={() => setIsOpen(false)}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between">
        <Logo />
        
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </nav>

        <div className="md:hidden">
           <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px]">
              <nav className="flex flex-col gap-6 mt-12">
                {links.map((link) => (
                  <NavLink key={link.href} {...link} />
                ))}
              </nav>
              <div className="mt-auto flex items-center gap-4">
                <LanguageSwitcher />
                <ModeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
