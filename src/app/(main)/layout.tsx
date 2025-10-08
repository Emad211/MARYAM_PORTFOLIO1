
"use client";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "../actions/analytics-actions";

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
  return (
    <div className="flex min-h-screen flex-col">
      <AnalyticsTracker />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
