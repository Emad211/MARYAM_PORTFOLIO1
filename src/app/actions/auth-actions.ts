'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Every action returns this shape (mirrors content-actions/enrollment-actions).
// `message` is a stable key the client maps to a localized string, not
// user-facing prose.
export type ActionResult = { success: boolean; message: string };

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const updatePasswordSchema = z.object({
    newPassword: z.string().min(8).max(200),
    confirmPassword: z.string().min(8).max(200),
});

/**
 * Sets the signed-in user's password. Reached from /reset-password, which is
 * only ever opened through the recovery link — so there is no old password to
 * re-check: the freshly exchanged recovery session itself proves identity.
 * Runs with the request-bound client so the change applies to the caller's own
 * account only.
 */
export async function updateOwnPassword(formData: FormData): Promise<ActionResult> {
    const parsed = updatePasswordSchema.safeParse({
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword'),
    });
    if (!parsed.success) {
        return { success: false, message: 'invalid_input' };
    }
    const { newPassword, confirmPassword } = parsed.data;
    if (newPassword !== confirmPassword) {
        return { success: false, message: 'passwords_mismatch' };
    }

    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
        return { success: false, message: 'unauthorized' };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
        console.error('Password update failed:', error);
        return { success: false, message: 'password_update_failed' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin/settings/account');
    return { success: true, message: 'password_updated' };
}
