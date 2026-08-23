'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getProfile } from '@/lib/cms-store';
import { createClient } from '@/lib/supabase/server';
import { studentUserId } from '@/lib/supabase/auth-guard';
import { profileToUpsert } from '@/lib/supabase/mappers';
import type { Profile } from '@/lib/types';

// Mirrors enrollment-actions: `message` is a stable key the client maps to a
// localized string, not user-facing prose.
type ActionResult = { success: boolean; message: string };

const profileSchema = z.object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().max(40).optional().default(''),
    germanLevel: z.string().trim().max(40).optional(),
    avatarUrl: z.string().trim().max(500).optional().transform((v) => (v === '' ? undefined : v)),
});

export async function getMyProfile(): Promise<Profile | null> {
    const userId = await studentUserId();
    if (!userId) return null;
    // RLS scopes the SELECT to the student's own row.
    return getProfile(userId);
}

export async function updateMyProfile(formData: FormData): Promise<ActionResult> {
    const userId = await studentUserId();
    if (!userId) return { success: false, message: 'unauthorized' };

    const parsed = profileSchema.safeParse({
        name: formData.get('name'),
        phone: formData.get('phone'),
        germanLevel: formData.get('germanLevel') || undefined,
        avatarUrl: formData.get('avatarUrl') || undefined,
    });
    if (!parsed.success) return { success: false, message: 'invalid_input' };
    const { name, phone, germanLevel, avatarUrl } = parsed.data;

    try {
        // Request-bound client → RLS owner-update policy authorizes this write.
        // Never the service-role client here.
        const supabase = await createClient();
        const { error } = await supabase.from('profiles').upsert(
            profileToUpsert({
                id: userId,
                name,
                phone,
                ...(germanLevel ? { germanLevel } : {}),
                ...(avatarUrl !== undefined ? { avatarUrl } : {}),
            })
        );
        if (error) throw error;

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/profile');
        return { success: true, message: 'updated' };
    } catch (error) {
        console.error('Failed to update profile:', error);
        return { success: false, message: 'update_failed' };
    }
}
