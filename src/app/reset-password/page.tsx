'use client';

import {Suspense, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Card, CardContent} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { updateOwnPassword } from '@/app/actions/auth-actions';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const resetContent = {
    en: {
        title: 'Set a New Password',
        description: 'Choose a strong new password for your Fluentia account.',
        newPasswordFieldLabel: 'New Password',
        confirmPasswordFieldLabel: 'Confirm Password',
        passwordHint: 'At least 8 characters.',
        mismatchMessage: 'The two passwords do not match.',
        tooShortMessage: 'Password must be at least 8 characters.',
        updateButton: 'Update Password',
        updating: 'Updating...',
        successTitle: 'Password Updated',
        successMessage: 'Your password has been changed. Redirecting...',
        errorTitle: 'Update Failed',
        // keyed messages from the server action
        passwords_mismatch: 'The two passwords do not match.',
        invalid_input: 'Please check your details and try again.',
        unauthorized: 'This link is invalid or has expired. Please request a new one.',
        password_update_failed: 'Could not update the password. Please try again.',
        invalidLinkTitle: 'Link Invalid or Expired',
        invalidLinkDescription: 'This password reset link is invalid or has expired. Please request a new one.',
        requestNewLink: 'Request New Link',
        backToSite: 'Back to Site',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        loadingText: 'Loading...',
    },
    de: {
        title: 'Neues Passwort festlegen',
        description: 'Wählen Sie ein sicheres neues Passwort für Ihr Fluentia-Konto.',
        newPasswordFieldLabel: 'Neues Passwort',
        confirmPasswordFieldLabel: 'Passwort bestätigen',
        passwordHint: 'Mindestens 8 Zeichen.',
        mismatchMessage: 'Die beiden Passwörter stimmen nicht überein.',
        tooShortMessage: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
        updateButton: 'Passwort aktualisieren',
        updating: 'Wird aktualisiert...',
        successTitle: 'Passwort aktualisiert',
        successMessage: 'Ihr Passwort wurde geändert. Weiterleitung...',
        errorTitle: 'Aktualisierung fehlgeschlagen',
        passwords_mismatch: 'Die beiden Passwörter stimmen nicht überein.',
        invalid_input: 'Bitte überprüfen Sie Ihre Angaben und versuchen Sie es erneut.',
        unauthorized: 'Dieser Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.',
        password_update_failed: 'Das Passwort konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.',
        invalidLinkTitle: 'Link ungültig oder abgelaufen',
        invalidLinkDescription: 'Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.',
        requestNewLink: 'Neuen Link anfordern',
        backToSite: 'Zurück zur Seite',
        showPassword: 'Passwort anzeigen',
        hidePassword: 'Passwort verbergen',
        loadingText: 'Wird geladen...',
    },
    fa: {
        title: 'تنظیم رمز عبور جدید',
        description: 'یک رمز عبور امن و جدید برای حساب Fluentia خود انتخاب کنید.',
        newPasswordFieldLabel: 'رمز عبور جدید',
        confirmPasswordFieldLabel: 'تکرار رمز عبور',
        passwordHint: 'حداقل ۸ کاراکتر.',
        mismatchMessage: 'دو رمز عبور با هم مطابقت ندارند.',
        tooShortMessage: 'رمز عبور باید حداقل ۸ کاراکتر باشد.',
        updateButton: 'به‌روزرسانی رمز عبور',
        updating: 'در حال به‌روزرسانی...',
        successTitle: 'رمز عبور به‌روزرسانی شد',
        successMessage: 'رمز عبور شما تغییر کرد. در حال هدایت...',
        errorTitle: 'به‌روزرسانی ناموفق بود',
        passwords_mismatch: 'دو رمز عبور با هم مطابقت ندارند.',
        invalid_input: 'لطفاً اطلاعات خود را بررسی کرده و دوباره تلاش کنید.',
        unauthorized: 'این لینک نامعتبر است یا منقضی شده است. لطفاً لینک جدیدی درخواست کنید.',
        password_update_failed: 'به‌روزرسانی رمز عبور ممکن نشد. لطفاً دوباره تلاش کنید.',
        invalidLinkTitle: 'لینک نامعتبر یا منقضی شده',
        invalidLinkDescription: 'این لینک بازیابی رمز عبور نامعتبر است یا منقضی شده است. لطفاً لینک جدیدی درخواست کنید.',
        requestNewLink: 'درخواست لینک جدید',
        backToSite: 'بازگشت به سایت',
        showPassword: 'نمایش رمز',
        hidePassword: 'پنهان کردن رمز',
        loadingText: 'در حال بارگذاری...',
    }
} as const;

// Server-action failure keys → localized message field on `content`.
type FailureKey = 'passwords_mismatch' | 'invalid_input' | 'unauthorized' | 'password_update_failed';

// The interactive form lives in its own component inside a Suspense boundary,
// mirroring the login page structure so the route can be prerendered.
function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {toast} = useToast();
  const { language } = useLanguage();
  const { user, loading } = useAuth();
  const content = resetContent[language];

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: content.errorTitle,
        description: content.tooShortMessage,
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: content.errorTitle,
        description: content.mismatchMessage,
      });
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.set('newPassword', newPassword);
    formData.set('confirmPassword', confirmPassword);

    const result = await updateOwnPassword(formData);

    if (result.success) {
      toast({
        title: content.successTitle,
        description: content.successMessage,
      });
      // Route by role — admins to their area, students to theirs.
      router.push(user?.role === 'student' ? '/dashboard' : '/admin');
    } else {
      const key = result.message as FailureKey;
      toast({
        variant: 'destructive',
        title: content.errorTitle,
        description: content[key] ?? content.password_update_failed,
      });
      setIsLoading(false);
    }
  };

  // The recovery session is still being resolved — hold on a quiet screen.
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
        <p className="text-muted-foreground">{content.loadingText}</p>
      </div>
    );
  }

  // No session: the recovery link was never opened through /auth/callback, or
  // the one-time code expired. Offer a fresh reset instead of a dead form.
  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{content.invalidLinkTitle}</h1>
            <p className="mt-2 text-muted-foreground">{content.invalidLinkDescription}</p>
          </div>
          <Card className="shadow-none border-0 sm:border sm:shadow-sm">
            <CardContent className="pt-6">
              <Button asChild size="lg" className="w-full">
                <Link href="/forgot-password">{content.requestNewLink}</Link>
              </Button>
            </CardContent>
          </Card>
          <div className="text-center">
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

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{content.title}</h1>
          <p className="mt-2 text-muted-foreground">{content.description}</p>
        </div>
        <Card className="shadow-none border-0 sm:border sm:shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{content.newPasswordFieldLabel}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11 pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? content.hidePassword : content.showPassword}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{content.passwordHint}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{content.confirmPasswordFieldLabel}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-11"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? content.updating : content.updateButton}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center">
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

// This page remains a Client Component as it handles user interaction (password
// reset form). The Suspense boundary mirrors the login page's structure and
// keeps the route prerenderable.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-background" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
