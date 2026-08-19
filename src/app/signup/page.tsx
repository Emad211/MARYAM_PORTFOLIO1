'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { signUpStudent } from '@/app/actions/enrollment-actions';
import { ArrowLeft } from 'lucide-react';

const signupContent = {
    en: {
        title: 'Create Account',
        description: 'Sign up to enroll in classes with Fluentia.',
        nameLabel: 'Full Name',
        namePlaceholder: 'Your Name',
        phoneLabel: 'Phone Number',
        phonePlaceholder: 'e.g., +1 234 567 8900',
        emailLabel: 'Email',
        passwordLabel: 'Password',
        passwordHint: 'At least 8 characters.',
        levelLabel: 'Current German level (optional)',
        levelNone: 'Not sure',
        signUpButton: 'Sign Up',
        signingUp: 'Creating account...',
        errorTitle: 'Sign Up Failed',
        successTitle: 'Account Created',
        successMessage: 'Welcome! Taking you to your dashboard...',
        // keyed messages from the server action
        invalid_input: 'Please check your details and try again.',
        signup_failed: 'Could not create the account. The email may already be registered.',
        autoLoginFailed: 'Account created. Please sign in.',
        backToSite: 'Back to Site',
        haveAccount: 'Already have an account?',
        signIn: 'Sign in',
    },
    de: {
        title: 'Konto erstellen',
        description: 'Registrieren Sie sich, um sich für Fluentia-Kurse anzumelden.',
        nameLabel: 'Vollständiger Name',
        namePlaceholder: 'Ihr Name',
        phoneLabel: 'Telefonnummer',
        phonePlaceholder: 'z.B. +49 123 4567890',
        emailLabel: 'Email',
        passwordLabel: 'Passwort',
        passwordHint: 'Mindestens 8 Zeichen.',
        levelLabel: 'Aktuelles Deutschniveau (optional)',
        levelNone: 'Nicht sicher',
        signUpButton: 'Registrieren',
        signingUp: 'Konto wird erstellt...',
        errorTitle: 'Registrierung fehlgeschlagen',
        successTitle: 'Konto erstellt',
        successMessage: 'Willkommen! Sie werden zu Ihrem Dashboard weitergeleitet...',
        invalid_input: 'Bitte überprüfen Sie Ihre Angaben und versuchen Sie es erneut.',
        signup_failed: 'Konto konnte nicht erstellt werden. Die E-Mail ist möglicherweise bereits registriert.',
        autoLoginFailed: 'Konto erstellt. Bitte melden Sie sich an.',
        backToSite: 'Zurück zur Seite',
        haveAccount: 'Sie haben bereits ein Konto?',
        signIn: 'Anmelden',
    },
    fa: {
        title: 'ساخت حساب کاربری',
        description: 'برای ثبت‌نام در کلاس‌های Fluentia ثبت‌نام کنید.',
        nameLabel: 'نام کامل',
        namePlaceholder: 'نام شما',
        phoneLabel: 'شماره تلفن',
        phonePlaceholder: 'مثلا: ۰۹۱۲۳۴۵۶۷۸۹',
        emailLabel: 'ایمیل',
        passwordLabel: 'رمز عبور',
        passwordHint: 'حداقل ۸ کاراکتر.',
        levelLabel: 'سطح فعلی زبان آلمانی (اختیاری)',
        levelNone: 'مطمئن نیستم',
        signUpButton: 'ثبت‌نام',
        signingUp: 'در حال ساخت حساب...',
        errorTitle: 'ثبت‌نام ناموفق بود',
        successTitle: 'حساب ساخته شد',
        successMessage: 'خوش آمدید! در حال انتقال به داشبورد شما...',
        invalid_input: 'لطفاً اطلاعات خود را بررسی کرده و دوباره تلاش کنید.',
        signup_failed: 'ساخت حساب ممکن نشد. ممکن است این ایمیل قبلاً ثبت شده باشد.',
        autoLoginFailed: 'حساب ساخته شد. لطفاً وارد شوید.',
        backToSite: 'بازگشت به سایت',
        haveAccount: 'قبلاً حساب دارید؟',
        signIn: 'ورود',
    },
} as const;

// Server-action failure keys → localized message field on `content`.
type FailureKey = 'invalid_input' | 'signup_failed';

function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 20 H 50 V 35 H 35 V 80 H 20 Z" fill="hsl(var(--primary))" />
                <path d="M50 20 H 80 V 35 H 65 V 55 H 50 Z" fill="hsl(var(--accent))" />
                <path d="M35 55 L 65 55 L 65 80 L 35 80 Z" fill="hsl(var(--foreground))" className="dark:fill-[var(--background)]" opacity="0.8" />
            </svg>
            <span className="font-headline text-2xl font-bold text-foreground">Fluentia</span>
        </Link>
    );
}

const GERMAN_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export default function SignupPage() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [germanLevel, setGermanLevel] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { language } = useLanguage();
    const { login } = useAuth();
    const content = signupContent[language];

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        formData.set('name', name);
        formData.set('phone', phone);
        formData.set('email', email);
        formData.set('password', password);
        if (germanLevel) formData.set('germanLevel', germanLevel);

        const result = await signUpStudent(formData);

        if (!result.success) {
            const key = result.message as FailureKey;
            toast({
                variant: 'destructive',
                title: content.errorTitle,
                description: content[key] ?? content.signup_failed,
            });
            setIsLoading(false);
            return;
        }

        // Account created — sign the student straight in and drop them on the
        // dashboard. If auto-login somehow fails, fall back to the login page.
        const loginResult = await login(email, password);
        if (loginResult.ok) {
            toast({ title: content.successTitle, description: content.successMessage });
            router.push('/dashboard');
        } else {
            toast({ title: content.successTitle, description: content.autoLoginFailed });
            router.push('/login');
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
                            <form onSubmit={handleSignup} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{content.nameLabel}</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder={content.namePlaceholder}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">{content.phoneLabel}</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder={content.phonePlaceholder}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{content.emailLabel}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
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
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className="h-11"
                                    />
                                    <p className="text-xs text-muted-foreground">{content.passwordHint}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="germanLevel">{content.levelLabel}</Label>
                                    <select
                                        id="germanLevel"
                                        value={germanLevel}
                                        onChange={(e) => setGermanLevel(e.target.value)}
                                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">{content.levelNone}</option>
                                        {GERMAN_LEVELS.map((level) => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                                    {isLoading ? content.signingUp : content.signUpButton}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <div className="text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {content.haveAccount}{' '}
                            <Link href="/login" className="font-medium text-primary hover:underline">
                                {content.signIn}
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
