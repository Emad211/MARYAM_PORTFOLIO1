
"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useLanguage } from "@/context/language-context";
import { updateUserCredentials } from "@/app/actions/content-actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const pageContent = {
  en: {
    pageTitle: "Account Settings",
    pageDescription: "Manage your administrator login credentials.",
    back: "Back to Settings",
    formTitle: "Change Credentials",
    formDescription: "Use this form to update your email and password.",
    currentPasswordLabel: "Current Password",
    newEmailLabel: "New Email Address",
    newPasswordLabel: "New Password",
    confirmPasswordLabel: "Confirm New Password",
    save: "Save Changes",
    saving: "Saving...",
    success: "Credentials updated successfully!",
    error: "Failed to update credentials.",
    passwordMismatch: "New passwords do not match.",
  },
  de: {
    pageTitle: "Kontoeinstellungen",
    pageDescription: "Verwalten Sie Ihre Administrator-Anmeldeinformationen.",
    back: "Zurück zu den Einstellungen",
    formTitle: "Anmeldeinformationen ändern",
    formDescription: "Verwenden Sie dieses Formular, um Ihre E-Mail-Adresse und Ihr Passwort zu aktualisieren.",
    currentPasswordLabel: "Aktuelles Passwort",
    newEmailLabel: "Neue E-Mail-Adresse",
    newPasswordLabel: "Neues Passwort",
    confirmPasswordLabel: "Neues Passwort bestätigen",
    save: "Änderungen speichern",
    saving: "Speichern...",
    success: "Anmeldeinformationen erfolgreich aktualisiert!",
    error: "Anmeldeinformationen konnten nicht aktualisiert werden.",
    passwordMismatch: "Die neuen Passwörter stimmen nicht überein.",
  },
  fa: {
    pageTitle: "تنظیمات حساب کاربری",
    pageDescription: "اطلاعات ورود به سیستم مدیر را مدیریت کنید.",
    back: "بازگشت به تنظیمات",
    formTitle: "تغییر اطلاعات کاربری",
    formDescription: "از این فرم برای به روز رسانی ایمیل و رمز عبور خود استفاده کنید.",
    currentPasswordLabel: "رمز عبور فعلی",
    newEmailLabel: "آدرس ایمیل جدید",
    newPasswordLabel: "رمز عبور جدید",
    confirmPasswordLabel: "تایید رمز عبور جدید",
    save: "ذخیره تغییرات",
    saving: "در حال ذخیره...",
    success: "اطلاعات با موفقیت به روز شد!",
    error: "به روز رسانی اطلاعات ناموفق بود.",
    passwordMismatch: "رمزهای عبور جدید مطابقت ندارند.",
  },
};

function SubmitButton({ content }: { content: (typeof pageContent)[keyof typeof pageContent] }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? content.saving : content.save}
    </Button>
  );
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { user, logout } = useAuth();
  const content = pageContent[language];

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleFormAction = async (formData: FormData) => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: content.error,
        description: content.passwordMismatch,
      });
      return;
    }

    const result = await updateUserCredentials(formData);
    if (result.success) {
      toast({
        title: content.success,
        description: "Please log in again with your new credentials."
      });
      logout();
      router.push('/login');
    } else {
      toast({
        variant: "destructive",
        title: content.error,
        description: result.message,
      });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{content.pageTitle}</h1>
          <p className="text-muted-foreground">{content.pageDescription}</p>
        </div>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{content.formTitle}</CardTitle>
          <CardDescription>{content.formDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleFormAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newEmail">{content.newEmailLabel}</Label>
              <Input 
                id="newEmail" 
                name="newEmail"
                type="email" 
                defaultValue={user?.email}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{content.currentPasswordLabel}</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="newPassword">{content.newPasswordLabel}</Label>
              <Input 
                id="newPassword" 
                name="newPassword" 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirmPassword">{content.confirmPasswordLabel}</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <SubmitButton content={content} />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
