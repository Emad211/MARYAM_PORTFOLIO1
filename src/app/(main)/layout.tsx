
"use client";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SkipLink } from "@/components/ui/accessibility";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLanguage } from "@/context/language-context";
import { trackPageView } from "../actions/analytics-actions";

const skipLabels: Record<string, string> = {
  en: "Skip to main content",
  de: "Zum Hauptinhalt springen",
  fa: "پرش به محتوای اصلی",
};

function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track page views in production-like environments, not during development refreshes.
    // In a real scenario, you might check process.env.NODE_ENV === 'production'
    if (pathname) {
      trackPageView(pathname).catch(console.error);
    }
  }, [pathname]);

  return null;
}


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <AnalyticsTracker />
      <SkipLink href="#main-content">{skipLabels[language]}</SkipLink>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
