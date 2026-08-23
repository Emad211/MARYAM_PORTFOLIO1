'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/browser';
import { updateMyProfile } from '@/app/actions/profile-actions';
import { updateOwnPassword } from '@/app/actions/auth-actions';
import type { Profile } from '@/lib/types';
import { Camera, Eye, EyeOff } from 'lucide-react';

const content = {
    en: {
        title: 'My Profile',
        subtitle: 'Manage your personal information and account security.',
        avatarTitle: 'Profile Photo',
        avatarAlt: 'Profile photo',
        changePhoto: 'Change Photo',
        uploading: 'Uploading...',
        file_invalid:
            'Please choose a PNG, JPEG or WebP image of at most 2 MB.',
        upload_failed: 'The image could not be uploaded. Please try again.',
        detailsTitle: 'Personal Details',
        nameLabel: 'Full Name',
        namePlaceholder: 'Your Name',
        phoneLabel: 'Phone Number',
        phonePlaceholder: 'e.g., +49 123 4567890',
        levelLabel: 'Current German level',
        levelNone: 'Not sure',
        saveButton: 'Save Changes',
        saving: 'Saving...',
        passwordTitle: 'Change Password',
        newPasswordLabel: 'New Password',
        confirmPasswordLabel: 'Confirm New Password',
        passwordHint: 'At least 8 characters.',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        updatePasswordButton: 'Update Password',
        updatingPassword: 'Updating...',
        // keyed messages from the server actions
        updated: 'Your profile has been updated.',
        update_failed: 'Could not save your profile. Please try again.',
        invalid_input: 'Please check your details and try again.',
        unauthorized: 'You are not signed in.',
        passwords_mismatch: 'The passwords do not match.',
        password_update_failed:
            'Could not change the password. Please try again.',
        password_updated: 'Your password has been changed.',
    },
    de: {
        title: 'Mein Profil',
        subtitle: 'Verwalten Sie Ihre persönlichen Daten und die Sicherheit Ihres Kontos.',
        avatarTitle: 'Profilfoto',
        avatarAlt: 'Profilfoto',
        changePhoto: 'Foto ändern',
        uploading: 'Wird hochgeladen...',
        file_invalid:
            'Bitte wählen Sie ein PNG-, JPEG- oder WebP-Bild mit maximal 2 MB.',
        upload_failed:
            'Das Bild konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.',
        detailsTitle: 'Persönliche Angaben',
        nameLabel: 'Vollständiger Name',
        namePlaceholder: 'Ihr Name',
        phoneLabel: 'Telefonnummer',
        phonePlaceholder: 'z.B. +49 123 4567890',
        levelLabel: 'Aktuelles Deutschniveau',
        levelNone: 'Nicht sicher',
        saveButton: 'Änderungen speichern',
        saving: 'Wird gespeichert...',
        passwordTitle: 'Passwort ändern',
        newPasswordLabel: 'Neues Passwort',
        confirmPasswordLabel: 'Neues Passwort bestätigen',
        passwordHint: 'Mindestens 8 Zeichen.',
        showPassword: 'Passwort anzeigen',
        hidePassword: 'Passwort verbergen',
        updatePasswordButton: 'Passwort aktualisieren',
        updatingPassword: 'Wird aktualisiert...',
        updated: 'Ihr Profil wurde aktualisiert.',
        update_failed:
            'Profil konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.',
        invalid_input: 'Bitte überprüfen Sie Ihre Angaben und versuchen Sie es erneut.',
        unauthorized: 'Sie sind nicht angemeldet.',
        passwords_mismatch: 'Die Passwörter stimmen nicht überein.',
        password_update_failed:
            'Passwort konnte nicht geändert werden. Bitte versuchen Sie es erneut.',
        password_updated: 'Ihr Passwort wurde geändert.',
    },
    fa: {
        title: 'پروفایل من',
        subtitle: 'اطلاعات شخصی و امنیت حساب خود را مدیریت کنید.',
        avatarTitle: 'عکس پروفایل',
        avatarAlt: 'عکس پروفایل',
        changePhoto: 'تغییر عکس',
        uploading: 'در حال بارگذاری...',
        file_invalid:
            'لطفاً تصویری با قالب PNG، JPEG یا WebP و حداکثر ۲ مگابایت انتخاب کنید.',
        upload_failed: 'بارگذاری تصویر ممکن نشد. لطفاً دوباره تلاش کنید.',
        detailsTitle: 'اطلاعات شخصی',
        nameLabel: 'نام کامل',
        namePlaceholder: 'نام شما',
        phoneLabel: 'شماره تلفن',
        phonePlaceholder: 'مثلا: ۰۹۱۲۳۴۵۶۷۸۹',
        levelLabel: 'سطح فعلی زبان آلمانی',
        levelNone: 'مطمئن نیستم',
        saveButton: 'ذخیره تغییرات',
        saving: 'در حال ذخیره...',
        passwordTitle: 'تغییر رمز عبور',
        newPasswordLabel: 'رمز عبور جدید',
        confirmPasswordLabel: 'تکرار رمز عبور جدید',
        passwordHint: 'حداقل ۸ کاراکتر.',
        showPassword: 'نمایش رمز',
        hidePassword: 'پنهان کردن رمز',
        updatePasswordButton: 'به‌روزرسانی رمز عبور',
        updatingPassword: 'در حال به‌روزرسانی...',
        updated: 'پروفایل شما به‌روزرسانی شد.',
        update_failed: 'ذخیره پروفایل ممکن نشد. لطفاً دوباره تلاش کنید.',
        invalid_input: 'لطفاً اطلاعات خود را بررسی کرده و دوباره تلاش کنید.',
        unauthorized: 'شما وارد نشده‌اید.',
        passwords_mismatch: 'رمزهای عبور یکسان نیستند.',
        password_update_failed: 'تغییر رمز عبور ممکن نشد. لطفاً دوباره تلاش کنید.',
        password_updated: 'رمز عبور شما تغییر کرد.',
    },
} as const;

// Union of every stable message key either server action can return.
type MessageKey =
    | 'updated'
    | 'update_failed'
    | 'invalid_input'
    | 'unauthorized'
    | 'passwords_mismatch'
    | 'password_update_failed'
    | 'password_updated';

const GERMAN_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const EXT_BY_TYPE: Record<(typeof ALLOWED_IMAGE_TYPES)[number], string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
};

function initialsOf(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

export function ProfileForm({ initialProfile }: { initialProfile: Profile | null }) {
    const { language } = useLanguage();
    const t = content[language];
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const supabase = useMemo(() => createClient(), []);

    const [name, setName] = useState(initialProfile?.name ?? '');
    const [phone, setPhone] = useState(initialProfile?.phone ?? '');
    const [germanLevel, setGermanLevel] = useState(initialProfile?.germanLevel ?? '');
    // The freshly uploaded URL lives here only; it reaches the DB on Save.
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialProfile?.avatarUrl);
    const [isUploading, setIsUploading] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isSaving, startSaving] = useTransition();
    const [isUpdatingPassword, startUpdatingPassword] = useTransition();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const describe = (key: string): string => {
        const k = key as MessageKey;
        return t[k] ?? t.update_failed;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !user) return;

        // Guard size/type BEFORE any network call.
        const isValidType = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);
        if (!isValidType || file.size > MAX_AVATAR_BYTES) {
            toast({ variant: 'destructive', description: t.file_invalid });
            return;
        }
        const imageType = file.type as (typeof ALLOWED_IMAGE_TYPES)[number];

        setIsUploading(true);
        try {
            // Bucket policy allows owner writes only inside their own
            // auth.uid()-named top folder.
            const ext = EXT_BY_TYPE[imageType];
            const path = `${user.id}/${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from('avatars').upload(path, file, {
                upsert: true,
                contentType: file.type,
            });
            if (error) throw error;

            const { data } = supabase.storage.from('avatars').getPublicUrl(path);
            setAvatarUrl(data.publicUrl);
        } catch (err) {
            console.error('Avatar upload failed:', err);
            toast({ variant: 'destructive', description: t.upload_failed });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = () => {
        startSaving(async () => {
            const formData = new FormData();
            formData.set('name', name);
            formData.set('phone', phone);
            if (germanLevel) formData.set('germanLevel', germanLevel);
            if (avatarUrl) formData.set('avatarUrl', avatarUrl);

            const result = await updateMyProfile(formData);
            if (result.success) {
                toast({ description: describe(result.message) });
                router.refresh();
            } else {
                toast({ variant: 'destructive', description: describe(result.message) });
            }
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startUpdatingPassword(async () => {
            const formData = new FormData();
            formData.set('newPassword', newPassword);
            formData.set('confirmPassword', confirmPassword);

            const result = await updateOwnPassword(formData);
            if (result.success) {
                toast({ description: describe(result.message) });
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast({ variant: 'destructive', description: describe(result.message) });
            }
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t.avatarTitle}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        {avatarUrl ? <AvatarImage src={avatarUrl} alt={t.avatarAlt} /> : null}
                        <AvatarFallback className="text-xl font-semibold">
                            {initialsOf(name)}
                        </AvatarFallback>
                    </Avatar>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2"
                    >
                        <Camera className="h-4 w-4" />
                        {isUploading ? t.uploading : t.changePhoto}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t.detailsTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSave();
                        }}
                        className="space-y-5"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="profile-name">{t.nameLabel}</Label>
                            <Input
                                id="profile-name"
                                type="text"
                                placeholder={t.namePlaceholder}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                maxLength={120}
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profile-phone">{t.phoneLabel}</Label>
                            <Input
                                id="profile-phone"
                                type="tel"
                                autoComplete="tel"
                                dir="ltr"
                                placeholder={t.phonePlaceholder}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                maxLength={40}
                                className="h-11 text-left"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profile-level">{t.levelLabel}</Label>
                            <select
                                id="profile-level"
                                value={germanLevel}
                                onChange={(e) => setGermanLevel(e.target.value)}
                                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">{t.levelNone}</option>
                                {GERMAN_LEVELS.map((level) => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? t.saving : t.saveButton}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t.passwordTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">{t.newPasswordLabel}</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="h-11 pe-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword((v) => !v)}
                                    aria-label={showNewPassword ? t.hidePassword : t.showPassword}
                                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">{t.passwordHint}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">{t.confirmPasswordLabel}</Label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="h-11 pe-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((v) => !v)}
                                    aria-label={showConfirmPassword ? t.hidePassword : t.showPassword}
                                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" disabled={isUpdatingPassword}>
                            {isUpdatingPassword ? t.updatingPassword : t.updatePasswordButton}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
