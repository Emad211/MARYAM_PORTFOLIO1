'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { createClient } from '@/lib/supabase/browser';
import { ArrowLeft } from 'lucide-react';

const forgotContent = {
  en: {
    title: 'Reset Password',
    description: 'Enter your account email and we will send you a reset link.',
    emailLabel: 'Email',
    sendButton: 'Send Reset Link',
    sending: 'Sending...',
    sentTitle: 'Check your inbox',
    sentMessage: 'If an account exists for this email, a reset link has been sent.',
    errorTitle: 'Request failed',
    errorMessage: 'Could not send the reset email. Please try again later.',
    backToLogin: 'Back to Sign In',
    backToSite: 'Back to Site',
  },
  de: {
    title: 'Passwort zurücksetzen',
    description: 'Geben Sie Ihre Konto-E-Mail ein und wir senden Ihnen einen Reset-Link.',
    emailLabel: 'Email',
    sendButton: 'Reset-Link senden',
    sending: 'Wird gesendet...',
    sentTitle: 'Prüfen Sie Ihr Postfach',
    sentMessage: 'Falls ein Konto für diese E-Mail existiert, wurde ein Reset-Link gesendet.',
    errorTitle: 'Anfrage fehlgeschlagen',
    errorMessage: 'Die Reset-E-Mail konnte nicht gesendet werden. Bitte später erneut versuchen.',
    backToLogin: 'Zurück zur Anmeldung',
    backToSite: 'Zurück zur Seite',
  },
  fa: {
    title: 'بازیابی رمز عبور',
    description: 'ایمیل حساب خود را وارد کنید تا لینک بازیابی برایتان ارسال شود.',
    emailLabel: 'ایمیل',
    sendButton: 'ارسال لینک بازیابی',
    sending: 'در حال ارسال...',
    sentTitle: 'صندوق ورودی را بررسی کنید',
    sentMessage: 'اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال شده است.',
    errorTitle: 'درخواست ناموفق بود',
    errorMessage: 'ارسال ایمیل بازیابی ممکن نشد. لطفاً بعداً دوباره تلاش کنید.',
    backToLogin: 'بازگشت به ورود',
    backToSite: 'بازگشت به سایت',
  },
};

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const content = forgotContent[language];

  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: content.sentTitle, description: content.sentMessage });
    } catch {
      toast({ variant: 'destructive', title: content.errorTitle, description: content.errorMessage });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{content.title}</h1>
          <p className="mt-2 text-muted-foreground">{content.description}</p>
        </div>
        <Card className="shadow-none border-0 sm:border sm:shadow-sm">
          <CardContent className="pt-6">
            {sent ? (
              <p className="text-center text-sm text-muted-foreground">{content.sentMessage}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">{content.emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={isSending}>
                  {isSending ? content.sending : content.sendButton}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <div className="text-center space-y-4">
          <p className="text-sm">
            <Link href="/login" className="font-medium text-primary hover:underline">
              {content.backToLogin}
            </Link>
          </p>
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {content.backToSite}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
