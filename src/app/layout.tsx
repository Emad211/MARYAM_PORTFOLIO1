import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display, Vazirmatn } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from '@/context/language-context';
import { AuthProvider } from '@/context/auth-context';
import { getContactContent } from '@/lib/cms-store';
import { AccessibleErrorBoundary } from '@/components/ui/accessibility';
import { PerformanceMonitor } from '@/components/performance-monitor';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

// Playfair has no Arabic glyphs; without this fa headlines fall back to system sans.
const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

// This is the base metadata. It can be overridden by pages.
export const metadata: Metadata = {
  metadataBase: new URL('https://fluentiaa.ir'),
  title: {
    default: 'Fluentia | آموزش زبان آلمانی',
    template: `%s | Fluentia`,
  },
  description:
    'یادگیری زبان آلمانی با مدرس و ممتاز آزمون TestDaF. کلاس‌های خصوصی، گروهی و کارگاه‌های تخصصی.',
  openGraph: {
    type: 'website',
    siteName: 'Fluentia',
    locale: 'fa_IR',
    alternateLocale: ['de_DE', 'en_US'],
    images: [{ url: '/teacher.jpg', width: 640, height: 640, alt: 'Fluentia' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fluentia | آموزش زبان آلمانی',
    description: 'کلاس‌های خصوصی، گروهی و کارگاه‌های تخصصی زبان آلمانی.',
    images: ['/teacher.jpg'],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F1E9' },
    { media: '(prefers-color-scheme: dark)', color: '#1B0500' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Footer needs contact details on every page. Fetch it here (public,
  // RLS-readable) and pass it through the auth context, which is the existing
  // provider the footer reads from. Auth *state* is owned client-side by the
  // Supabase session — the server no longer derives or leaks it.
  const contactContent = await getContactContent();

  return (
    // fa is the SSR content language; LanguageProvider flips lang/dir for en/de.
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${vazirmatn.variable} font-body antialiased`}>
        <AccessibleErrorBoundary>
          <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
          >
            <AuthProvider initialContactContent={contactContent}>
                <LanguageProvider>
                    <PerformanceMonitor />
                    {children}
                    <Toaster />
                </LanguageProvider>
            </AuthProvider>
          </ThemeProvider>
        </AccessibleErrorBoundary>
      </body>
    </html>
  );
}
