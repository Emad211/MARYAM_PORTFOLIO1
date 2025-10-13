import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from '@/context/language-context';
import { AuthProvider } from '@/context/auth-context';
import { adminUser, contactContent } from '@/lib/data-loader';
import { cookies } from 'next/headers';
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

// This is the base metadata. It can be overridden by pages.
export const metadata: Metadata = {
  title: {
    default: 'Fluentia',
    template: `%s | Fluentia`,
  },
  description: 'Learn languages with a master educator.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token');
  const isAuthenticated = !!authToken;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-body antialiased`}>
        <AccessibleErrorBoundary>
          <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
          >
            <AuthProvider 
              initialAdminUser={adminUser} 
              initialContactContent={contactContent}
              isAuthenticated={isAuthenticated}
            >
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
