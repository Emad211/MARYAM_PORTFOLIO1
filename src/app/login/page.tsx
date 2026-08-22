
'use client';

import {Suspense, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {useRouter, useSearchParams} from 'next/navigation';
import {Card, CardContent} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { ArrowLeft } from 'lucide-react';

const loginContent = {
    en: {
        title: 'Sign In',
        description: 'Welcome back. Sign in to your Fluentia account.',
        emailLabel: 'Email',
        passwordLabel: 'Password',
        loginButton: 'Login',
        loggingIn: 'Logging in...',
        errorTitle: 'Login Failed',
        errorMessage: 'Invalid email or password. Please try again.',
        successTitle: 'Login Successful',
        successMessage: 'Redirecting...',
        backToSite: 'Back to Site',
        noAccount: "Don't have an account?",
        signUp: 'Sign up'
    },
    de: {
        title: 'Anmelden',
        description: 'Willkommen zurück. Melden Sie sich bei Ihrem Fluentia-Konto an.',
        emailLabel: 'Email',
        passwordLabel: 'Passwort',
        loginButton: 'Anmelden',
        loggingIn: 'Anmelden...',
        errorTitle: 'Anmeldung fehlgeschlagen',
        errorMessage: 'Ungültige E-Mail oder Passwort. Bitte versuchen Sie es erneut.',
        successTitle: 'Anmeldung erfolgreich',
        successMessage: 'Weiterleitung...',
        backToSite: 'Zurück zur Seite',
        noAccount: 'Noch kein Konto?',
        signUp: 'Registrieren'
    },
    fa: {
        title: 'ورود',
        description: 'خوش آمدید. به حساب Fluentia خود وارد شوید.',
        emailLabel: 'ایمیل',
        passwordLabel: 'رمز عبور',
        loginButton: 'ورود',
        loggingIn: 'در حال ورود...',
        errorTitle: 'ورود ناموفق بود',
        errorMessage: 'ایمیل یا رمز عبور نامعتبر است. لطفاً دوباره تلاش کنید.',
        successTitle: 'ورود موفقیت‌آمیز بود',
        successMessage: 'در حال هدایت...',
        backToSite: 'بازگشت به سایت',
        noAccount: 'حساب کاربری ندارید؟',
        signUp: 'ثبت‌نام'
    }
}

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

// The interactive form lives in its own component because it reads
// useSearchParams(); Next requires that to sit inside a Suspense boundary so the
// route can be prerendered instead of bailing the whole page to client rendering.
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const {toast} = useToast();
  const { language } = useLanguage();
  const { login } = useAuth();
  const content = loginContent[language];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);

    if (result.ok) {
      toast({
        title: content.successTitle,
        description: content.successMessage,
      });
      // An explicit redirect target (set by the proxy) wins; otherwise route by
      // role — admins to the dashboard, students to their area.
      const fallback = result.role === 'student' ? '/dashboard' : '/admin';
      const redirectUrl = searchParams.get('redirect') || fallback;
      router.push(redirectUrl);
    } else {
      toast({
        variant: 'destructive',
        title: content.errorTitle,
        description: content.errorMessage,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-secondary">
         <Image 
            src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxsaWJyYXJ5fGVufDB8fHx8MTc1MzkxMjM3Nnww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Library"
            fill
            className="object-cover"
            data-ai-hint="library books"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col items-center text-center">
                <Logo />
                <h1 className="mt-6 text-2xl font-bold tracking-tight md:text-3xl">{content.title}</h1>
                <p className="mt-2 text-muted-foreground">{content.description}</p>
            </div>
            <Card className="shadow-none border-0 sm:border sm:shadow-sm">
                <CardContent className="pt-6">
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                    <Label htmlFor="email">{content.emailLabel}</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="password">{content.passwordLabel}</Label>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11"
                    />
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? content.loggingIn : content.loginButton}
                    </Button>
                </form>
                </CardContent>
            </Card>
            <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                    {content.noAccount}{' '}
                    <Link href="/signup" className="font-medium text-primary hover:underline">
                        {content.signUp}
                    </Link>
                </p>
                <Button variant="ghost" asChild>
                    <Link href="/" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        {content.backToSite}
                    </Link>
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}

// This page remains a Client Component as it handles user interaction (login
// form). The Suspense boundary satisfies Next's requirement for useSearchParams.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
