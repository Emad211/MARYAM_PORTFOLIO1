
"use client";

import { useLanguage } from "@/context/language-context";
import { Linkedin, Send, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { useAuth } from "@/context/auth-context";

const footerContent = {
  en: {
    description: "Empowering students to master new languages and discover new cultures.",
    rights: "All rights reserved.",
    navigate: "Navigate",
    social: "Social",
    getInTouch: "Get in Touch",
    contactButton: "Contact Me",
    adminLogin: "Admin Login",
  },
  de: {
    description: "Studenten befähigen, neue Sprachen zu meistern und neue Kulturen zu entdecken.",
    rights: "Alle Rechte vorbehalten.",
    navigate: "Navigieren",
    social: "Sozial",
    getInTouch: "Kontakt aufnehmen",
    contactButton: "Kontaktieren Sie mich",
    adminLogin: "Admin-Anmeldung",
  },
  fa: {
    description: "توانمندسازی دانشجویان برای تسلط بر زبان‌های جدید و کشف فرهنگ‌های نو.",
    rights: "تمامی حقوق محفوظ است.",
    navigate: "دسترسی سریع",
    social: "شبکه‌های اجتماعی",
    getInTouch: "در تماس باشید",
    contactButton: "تماس با من",
    adminLogin: "ورود مدیر",
  },
};

const navLinks = {
  en: [
    { href: "/about", label: "About" },
    { href: "/classes", label: "Classes" },
    { href: "/blog", label: "Blog" },
  ],
  de: [
    { href: "/about", label: "Über mich" },
    { href: "/classes", label: "Kurse" },
    { href: "/blog", label: "Blog" },
  ],
  fa: [
    { href: "/about", label: "درباره من" },
    { href: "/classes", label: "کلاس‌ها" },
    { href: "/blog", label: "بلاگ" },
  ],
};

const adminLink = {
  en: { href: "/login", label: "Admin Login" },
  de: { href: "/login", label: "Admin-Anmeldung" },
  fa: { href: "/login", label: "ورود مدیر" },
}

export function Footer() {
  const { language } = useLanguage();
  const { contactContent } = useAuth();
  const content = footerContent[language];
  const links = navLinks[language];
  
  const data = contactContent;

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-y-12 lg:grid-cols-4 lg:gap-x-8">
          
          {/* Brand Info */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center justify-center gap-2 sm:justify-start">
               <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 20 H 50 V 35 H 35 V 80 H 20 Z" fill="hsl(var(--primary))" />
                  <path d="M50 20 H 80 V 35 H 65 V 55 H 50 Z" fill="hsl(var(--accent))" />
                  <path d="M35 55 L 65 55 L 65 80 L 35 80 Z" fill="hsl(var(--foreground))" className="dark:fill-hsl-var-background" opacity="0.8" />
               </svg>
              <span className="font-headline text-xl font-bold">Fluentia</span>
            </Link>
            <p className="mt-4 text-center text-sm text-secondary-foreground/80 sm:text-left">{content.description}</p>
          </div>
          
          {/* Navigation */}
          <div className="text-center sm:text-left">
            <h3 className="font-headline text-lg font-semibold">{content.navigate}</h3>
            <ul className="mt-4 space-y-3">
              {links.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-secondary-foreground/80 transition-colors hover:text-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={adminLink[language].href} className="text-sm text-secondary-foreground/80 transition-colors hover:text-primary hover:underline">
                  {adminLink[language].label}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Social */}
          {data && (
            <div className="text-center sm:text-left">
              <h3 className="font-headline text-lg font-semibold">{content.social}</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <a href={data.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-sm text-secondary-foreground/80 transition-colors hover:text-primary hover:underline">
                    <Linkedin className="h-5 w-5" />
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href={data.telegramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-sm text-secondary-foreground/80 transition-colors hover:text-primary hover:underline">
                    <Send className="h-5 w-5" />
                    Telegram
                  </a>
                </li>
              </ul>
            </div>
          )}
          
          {/* Get in Touch */}
          {data && (
            <div className="col-span-2 flex flex-col items-center text-center lg:col-span-1 lg:items-start lg:text-left">
              <h3 className="font-headline text-lg font-semibold">{content.getInTouch}</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <a href={`mailto:${data.email}`} className="inline-flex items-center gap-3 text-sm text-secondary-foreground/80 transition-colors hover:text-primary hover:underline">
                    <Mail className="h-5 w-5" />
                    {data.email}
                  </a>
                </li>
              </ul>
              <Button asChild className="mt-4 w-full max-w-xs">
                <Link href="/contact">{content.contactButton}</Link>
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-16 border-t border-border pt-8 text-center text-sm text-secondary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Fluentia. {content.rights}</p>
        </div>
      </div>
    </footer>
  );
}
