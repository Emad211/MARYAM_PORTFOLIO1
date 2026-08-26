'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, ArrowLeft, LayoutDashboard, UserRound, CalendarDays, MessageCircle, Wallet } from 'lucide-react';
import { NotificationBell } from '@/components/dashboard/notification-bell';

const shellContent = {
    en: { site: 'Back to Site', logout: 'Log Out', greeting: 'My Account' },
    de: { site: 'Zur Seite', logout: 'Abmelden', greeting: 'Mein Konto' },
    fa: { site: 'بازگشت به سایت', logout: 'خروج', greeting: 'حساب من' },
} as const;

const navContent = {
    en: { dashboard: 'Dashboard', profile: 'Profile', sessions: 'Sessions', messages: 'Messages', payments: 'Payments' },
    de: { dashboard: 'Übersicht', profile: 'Profil', sessions: 'Termine', messages: 'Nachrichten', payments: 'Zahlungen' },
    fa: { dashboard: 'داشبورد', profile: 'پروفایل', sessions: 'جلسات', messages: 'گفتگو', payments: 'پرداخت‌ها' },
} as const;

function DashboardSkeleton() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <div className="w-full max-w-3xl p-8 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <div className="space-y-4 pt-4">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
            </div>
        </div>
    );
}

function StudentArea({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { language } = useLanguage();
    const content = shellContent[language];
    const nav = navContent[language];

    // Only a student session may see the dashboard. The proxy already gates
    // /dashboard on the server; this is the client-side fallback for a session
    // that changes while the page is open (cookie cleared, or a non-student who
    // somehow reaches this tree).
    const isStudent = user?.role === 'student';

    useEffect(() => {
        if (!loading && !isStudent) {
            router.push('/login');
        }
    }, [isStudent, loading, router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (loading || !isStudent) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <header className="border-b bg-background">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
                    <Link href="/" className="flex items-center gap-2">
                        <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 20 H 50 V 35 H 35 V 80 H 20 Z" fill="hsl(var(--primary))" />
                            <path d="M50 20 H 80 V 35 H 65 V 55 H 50 Z" fill="hsl(var(--accent))" />
                            <path d="M35 55 L 65 55 L 65 80 L 35 80 Z" fill="hsl(var(--foreground))" className="dark:fill-[var(--background)]" opacity="0.8" />
                        </svg>
                        <span className="font-headline text-xl font-bold text-foreground">Fluentia</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">{content.site}</span>
                            </Link>
                        </Button>
                        {isStudent ? <NotificationBell /> : null}
                        <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">{content.logout}</span>
                        </Button>
                    </div>
                </div>
                <nav aria-label={content.greeting} className="mx-auto flex max-w-4xl gap-2 px-4 pb-3">
                    <Button
                        variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
                        size="sm"
                        asChild
                    >
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            {nav.dashboard}
                        </Link>
                    </Button>
                    <Button
                        variant={pathname.startsWith('/dashboard/profile') ? 'secondary' : 'ghost'}
                        size="sm"
                        asChild
                    >
                        <Link href="/dashboard/profile" className="flex items-center gap-2">
                            <UserRound className="h-4 w-4" />
                            {nav.profile}
                        </Link>
                    </Button>
                    <Button
                        variant={pathname.startsWith('/dashboard/sessions') ? 'secondary' : 'ghost'}
                        size="sm"
                        asChild
                    >
                        <Link href="/dashboard/sessions" className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            {nav.sessions}
                        </Link>
                    </Button>
                    <Button
                        variant={pathname.startsWith('/dashboard/messages') ? 'secondary' : 'ghost'}
                        size="sm"
                        asChild
                    >
                        <Link href="/dashboard/messages" className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            {nav.messages}
                        </Link>
                    </Button>
                    <Button
                        variant={pathname.startsWith('/dashboard/payments') ? 'secondary' : 'ghost'}
                        size="sm"
                        asChild
                    >
                        <Link href="/dashboard/payments" className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            {nav.payments}
                        </Link>
                    </Button>
                </nav>
            </header>
            <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <StudentArea>{children}</StudentArea>;
}
