'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
    getClasses,
    saveClasses,
    getEnrollments,
    insertEnrollment,
    updateEnrollmentStatus,
    countApprovedEnrollments,
} from '@/lib/cms-store';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRequest, studentUserId } from '@/lib/supabase/auth-guard';
import { profileToUpsert } from '@/lib/supabase/mappers';
import type { Enrollment, Class } from '@/lib/types';

// Every action returns this shape (mirrors content-actions). `message` is a
// stable key the client maps to a localized string, not user-facing prose.
type ActionResult = { success: boolean; message: string };

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const signupSchema = z.object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(3).max(40),
    email: z.string().trim().email().max(200),
    password: z.string().min(8).max(200),
    germanLevel: z.string().trim().max(40).optional(),
});

const enrollSchema = z.object({
    classSlug: z.string().trim().min(1).max(120),
    learningGoal: z.string().trim().max(2000).optional(),
    motivation: z.string().trim().max(2000).optional(),
});

// ---------------------------------------------------------------------------
// Student account signup
//
// Runs with the service-role client for two reasons: setting the
// server-controlled `role: 'student'` in app_metadata (never user_metadata),
// and inserting the profile row before any session exists (RLS would reject an
// unauthenticated profile insert). The account is auto-confirmed — approval is
// gated at the *enrollment* level, not the account level. A later payment step
// slots between enroll (pending) and approve without touching signup.
// ---------------------------------------------------------------------------

export async function signUpStudent(formData: FormData): Promise<ActionResult> {
    const parsed = signupSchema.safeParse({
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        password: formData.get('password'),
        germanLevel: formData.get('germanLevel') || undefined,
    });
    if (!parsed.success) {
        return { success: false, message: 'invalid_input' };
    }
    const { name, phone, email, password, germanLevel } = parsed.data;

    const admin = createAdminClient();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: 'student' },
    });
    if (createErr || !created.user) {
        // Most commonly the email is already registered; keep the message generic.
        console.error('Student signup failed at createUser:', createErr);
        return { success: false, message: 'signup_failed' };
    }

    const { error: profileErr } = await admin.from('profiles').upsert(
        profileToUpsert({
            id: created.user.id,
            name,
            phone,
            ...(germanLevel ? { germanLevel } : {}),
        })
    );
    if (profileErr) {
        // Roll back the half-provisioned account so a retry can succeed cleanly.
        await admin.auth.admin.deleteUser(created.user.id);
        console.error('Student signup failed at profile insert:', profileErr);
        return { success: false, message: 'signup_failed' };
    }

    return { success: true, message: 'signup_success' };
}

// ---------------------------------------------------------------------------
// Student enrollment lifecycle (request-bound client → RLS applies)
// ---------------------------------------------------------------------------

export async function enrollInClass(formData: FormData): Promise<ActionResult> {
    const userId = await studentUserId();
    if (!userId) return { success: false, message: 'unauthorized' };

    const parsed = enrollSchema.safeParse({
        classSlug: formData.get('classSlug'),
        learningGoal: formData.get('learningGoal') || undefined,
        motivation: formData.get('motivation') || undefined,
    });
    if (!parsed.success) return { success: false, message: 'invalid_input' };
    const { classSlug, learningGoal, motivation } = parsed.data;

    // Only an active class accepts enrollments (full/inactive are closed).
    const classes = await getClasses();
    const cls = classes.find((c) => c.slug === classSlug);
    if (!cls) return { success: false, message: 'class_not_found' };
    if (cls.status !== 'active') return { success: false, message: 'class_unavailable' };

    try {
        await insertEnrollment({
            userId,
            classSlug,
            ...(learningGoal ? { learningGoal } : {}),
            ...(motivation ? { motivation } : {}),
        });
        revalidatePath('/dashboard');
        revalidatePath(`/classes/${classSlug}`);
        return { success: true, message: 'enroll_success' };
    } catch (error) {
        console.error('Failed to enroll in class:', error);
        return { success: false, message: 'enroll_failed' };
    }
}

export async function cancelEnrollment(enrollmentId: string): Promise<ActionResult> {
    const userId = await studentUserId();
    if (!userId) return { success: false, message: 'unauthorized' };

    try {
        // RLS restricts the update to the caller's own row and to
        // pending/cancelled only — a foreign id simply matches nothing.
        await updateEnrollmentStatus(enrollmentId, 'cancelled');
        revalidatePath('/dashboard');
        return { success: true, message: 'cancel_success' };
    } catch (error) {
        console.error('Failed to cancel enrollment:', error);
        return { success: false, message: 'cancel_failed' };
    }
}

export async function getMyEnrollments(): Promise<Enrollment[]> {
    const userId = await studentUserId();
    if (!userId) return [];
    // RLS scopes the SELECT to the student's own rows.
    return await getEnrollments();
}

// ---------------------------------------------------------------------------
// Admin decisions (approve / reject) with capacity enforcement
//
// Capacity is measured by APPROVED enrollments against the class's
// `maxStudents`. Approving the last seat flips the class to 'full'; rejecting
// an approved seat on a full class re-opens it to 'active'. A manually
// 'inactive' class is never auto-toggled.
// ---------------------------------------------------------------------------

/** Set one class's status via the existing full-array setter (upsert-all,
 *  delete-missing) without disturbing any other class. */
async function setClassStatus(
    classes: Class[],
    classSlug: string,
    status: Class['status']
): Promise<void> {
    await saveClasses(classes.map((c) => (c.slug === classSlug ? { ...c, status } : c)));
}

export async function approveEnrollment(
    id: string,
    classSlug: string
): Promise<ActionResult> {
    if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

    const classes = await getClasses();
    const cls = classes.find((c) => c.slug === classSlug);
    if (!cls) return { success: false, message: 'class_not_found' };

    // Block over-filling a capped class.
    const approved = await countApprovedEnrollments(classSlug);
    if (cls.maxStudents != null && approved >= cls.maxStudents) {
        return { success: false, message: 'class_full' };
    }

    try {
        await updateEnrollmentStatus(id, 'approved');

        // Last seat taken → close the class.
        if (cls.maxStudents != null && approved + 1 >= cls.maxStudents && cls.status === 'active') {
            await setClassStatus(classes, classSlug, 'full');
        }

        revalidatePath('/admin/registrations');
        revalidatePath('/dashboard');
        revalidatePath('/classes');
        revalidatePath(`/classes/${classSlug}`);
        return { success: true, message: 'approve_success' };
    } catch (error) {
        console.error('Failed to approve enrollment:', error);
        return { success: false, message: 'approve_failed' };
    }
}

export async function rejectEnrollment(
    id: string,
    classSlug: string
): Promise<ActionResult> {
    if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

    try {
        await updateEnrollmentStatus(id, 'rejected');

        // Rejecting may free a seat on a full class → re-open it.
        const classes = await getClasses();
        const cls = classes.find((c) => c.slug === classSlug);
        if (cls && cls.status === 'full') {
            const approved = await countApprovedEnrollments(classSlug);
            if (cls.maxStudents == null || approved < cls.maxStudents) {
                await setClassStatus(classes, classSlug, 'active');
            }
        }

        revalidatePath('/admin/registrations');
        revalidatePath('/dashboard');
        revalidatePath('/classes');
        revalidatePath(`/classes/${classSlug}`);
        return { success: true, message: 'reject_success' };
    } catch (error) {
        console.error('Failed to reject enrollment:', error);
        return { success: false, message: 'reject_failed' };
    }
}

// ---------------------------------------------------------------------------
// Admin listing — enrollments enriched with who the student is.
//
// An enrollment row carries only `userId`. The admin table needs a name/email
// to act on. Names/phone/level live in `profiles` (admin-readable via RLS);
// the email lives on `auth.users` and is reachable ONLY through the Auth Admin
// API. So we read profiles + auth users with the service-role client (this is
// an admin-gated action) and stitch them onto each enrollment. Class titles are
// resolved client-side by language, so they are not joined here.
// ---------------------------------------------------------------------------

export interface AdminEnrollment extends Enrollment {
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    studentGermanLevel?: string;
}

export async function getEnrollmentsForAdmin(): Promise<AdminEnrollment[]> {
    if (!(await isAdminRequest())) return [];

    const enrollments = await getEnrollments();
    if (enrollments.length === 0) return [];

    const admin = createAdminClient();
    const userIds = [...new Set(enrollments.map((e) => e.userId))];

    // Profiles (name / phone / level) — bulk read scoped to the enrolled users.
    const { data: profileRows, error: profileErr } = await admin
        .from('profiles')
        .select('id, name, phone, german_level')
        .in('id', userIds);
    if (profileErr) {
        console.error('Failed to load profiles for admin enrollments:', profileErr);
    }
    const profileById = new Map(
        (profileRows ?? []).map((p) => [
            p.id as string,
            p as { id: string; name: string; phone: string; german_level: string | null },
        ])
    );

    // Emails live on auth.users — only the Auth Admin API can read them. Page
    // through users once and index by id; a few pages cover any realistic size.
    const emailById = new Map<string, string>();
    const perPage = 200;
    for (let page = 1; page <= 25; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
        if (error) {
            console.error('Failed to list users for admin enrollments:', error);
            break;
        }
        for (const u of data.users) {
            if (u.email) emailById.set(u.id, u.email);
        }
        if (data.users.length < perPage) break;
        if (page === 25) {
            console.warn('listUsers hit the 25-page cap; some emails may be missing.');
        }
    }

    return enrollments.map((e) => {
        const profile = profileById.get(e.userId);
        const germanLevel = profile?.german_level ?? undefined;
        return {
            ...e,
            studentName: profile?.name || '—',
            studentEmail: emailById.get(e.userId) ?? '—',
            studentPhone: profile?.phone ?? '',
            ...(germanLevel ? { studentGermanLevel: germanLevel } : {}),
        };
    });
}
