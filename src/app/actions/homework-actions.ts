'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, createPublicClient } from '@/lib/supabase/server';
import { isAdminRequest, studentUserId } from '@/lib/supabase/auth-guard';
import type {
    HomeworkAssignment,
    HomeworkItem,
    LmsLesson,
    LmsSkill,
    LocalizedString,
} from '@/lib/types';

/**
 * Homework assignments (teacher-ease wave): the admin pins a lesson of a
 * class to a due date; approved-enrolled students see their class's list.
 * `done` is derived from lesson_progress per student, never stored here.
 *
 * Mutations return the house ActionResult shape (`message` is a stable key
 * the client maps to a localized string). All reads/writes go through the
 * request-bound client so RLS is exercised for real; only the lesson
 * existence check uses the cookie-less public client (anon-readable).
 */

export interface ActionResult {
    success: boolean;
    message: string;
    /** Populated on successful insert so the client can link the new row. */
    id?: string;
}

const classSlugSchema = z.string().min(1).max(120).regex(/^[a-z0-9-]+$/);
const idSchema = z.string().uuid();

// --- FormData helpers (house style, mirrored from sessions-admin-actions) ---

function str(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

/** datetime-local shape: "YYYY-MM-DDTHH:mm" (no seconds/timezone). */
const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function parseDueAt(raw: string): string | null {
    if (!DATETIME_LOCAL_RE.test(raw)) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// --- Row shapes (JSONB columns arrive untyped; mappers stay inline) ---

interface LessonRow {
    id: string;
    module_id: string;
    title: unknown;
    body: unknown;
    video_url: string | null;
    skill: string;
    duration_min: number | null;
    is_free_preview: boolean;
    sort_order: number;
}

interface HomeworkRow {
    id: string;
    class_slug: string;
    lesson_id: string;
    due_at: string;
    created_at: string;
    // FK embed `lessons(*)` — object on modern PostgREST, array on some paths.
    lessons: LessonRow | LessonRow[] | null;
}

// Local duplicate of lms-actions' mapLessonRow so both action files stay
// independently importable for the parallel UI agents.
function mapLessonRow(row: LessonRow): LmsLesson {
    return {
        id: row.id,
        moduleId: row.module_id,
        title: row.title as LocalizedString,
        body: row.body as LocalizedString,
        ...(row.video_url ? { videoUrl: row.video_url } : {}),
        skill: row.skill as LmsSkill,
        ...(row.duration_min != null ? { durationMin: row.duration_min } : {}),
        isFreePreview: row.is_free_preview,
        sortOrder: row.sort_order,
    };
}

// --- Admin authoring ---

export async function createHomeworkAssignment(formData: FormData): Promise<ActionResult> {
    if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

    const dueAtIso = parseDueAt(str(formData, 'dueAtLocal').trim());
    const parsed = z
        .object({
            classSlug: classSlugSchema,
            lessonId: idSchema,
            dueAt: z.string(),
        })
        .safeParse({
            classSlug: str(formData, 'classSlug').trim(),
            lessonId: str(formData, 'lessonId').trim(),
            ...(dueAtIso ? { dueAt: dueAtIso } : {}),
        });
    if (!parsed.success) {
        console.error('createHomeworkAssignment validation failed:', parsed.error.flatten());
        return { success: false, message: 'invalid_input' };
    }
    const { classSlug, lessonId, dueAt } = parsed.data;

    // Lessons are public-read; verify before insert so a bad uuid surfaces as
    // not_found rather than an FK violation.
    const pub = createPublicClient();
    const { data: lesson } = await pub
        .from('lessons')
        .select('id')
        .eq('id', lessonId)
        .maybeSingle();
    if (!lesson) return { success: false, message: 'not_found' };

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('homework_assignments')
            .insert({ class_slug: classSlug, lesson_id: lessonId, due_at: dueAt })
            .select('id')
            .single();
        if (error) throw error;
        const newId = (data as { id: string } | null)?.id;

        // Best-effort fan-out to approved students; notification failure must
        // not fail the save itself.
        if (newId) {
            try {
                const { error: rpcError } = await supabase.rpc('notify_class_homework', {
                    p_class_slug: classSlug,
                    p_homework_id: newId,
                });
                if (rpcError) console.warn('notify_class_homework failed:', rpcError);
            } catch (rpcError) {
                console.warn('notify_class_homework threw:', rpcError);
            }
        }

        revalidatePath('/admin/homework');
        return { success: true, message: 'saved', ...(newId ? { id: newId } : {}) };
    } catch (error) {
        console.error('Failed to save homework assignment:', error);
        return { success: false, message: 'save_failed' };
    }
}

export async function getHomeworkForAdmin(): Promise<
    Array<HomeworkAssignment & { lessonTitleFa: string; assignedCount: number; doneCount: number }>
> {
    if (!(await isAdminRequest())) return [];

    const supabase = await createClient();
    const { data: homeworkData, error: homeworkError } = await supabase
        .from('homework_assignments')
        .select('*')
        .order('due_at', { ascending: true });
    if (homeworkError || !homeworkData) {
        console.error('Failed to load homework for admin:', homeworkError);
        return [];
    }
    const homework = homeworkData as Array<{
        id: string;
        class_slug: string;
        lesson_id: string;
        due_at: string;
        created_at: string;
    }>;
    if (homework.length === 0) return [];

    const lessonIds = [...new Set(homework.map((h) => h.lesson_id))];
    const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('id, title')
        .in('id', lessonIds);
    if (lessonError || !lessonData) {
        console.error('Failed to load homework lesson titles:', lessonError);
        return [];
    }
    const titleFaByLesson = new Map(
        (lessonData as { id: string; title: unknown }[]).map((l) => [
            l.id,
            (l.title as LocalizedString).fa ?? '',
        ])
    );

    const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('user_id, class_slug')
        .eq('status', 'approved');
    if (enrollmentError || !enrollmentData) {
        console.error('Failed to load enrollments for homework stats:', enrollmentError);
        return [];
    }
    const approvedByClass = new Map<string, string[]>();
    for (const row of enrollmentData as { user_id: string; class_slug: string }[]) {
        const list = approvedByClass.get(row.class_slug) ?? [];
        list.push(row.user_id);
        approvedByClass.set(row.class_slug, list);
    }

    // done = an assigned student has a lesson_progress row for that lesson.
    // Two bounded selects (by lesson, by user), intersected in JS.
    const userIds = [...new Set(Array.from(approvedByClass.values()).flat())];
    const pairKey = (lessonId: string, uid: string) => `${lessonId}|${uid}`;
    const byLesson = new Set<string>();
    const { data: byLessonData, error: byLessonError } = await supabase
        .from('lesson_progress')
        .select('lesson_id, user_id')
        .in('lesson_id', lessonIds);
    if (byLessonError) {
        console.error('Failed to load lesson progress (by lesson):', byLessonError);
        return [];
    }
    for (const row of byLessonData as { lesson_id: string; user_id: string }[]) {
        byLesson.add(pairKey(row.lesson_id, row.user_id));
    }
    const donePairs = new Set<string>();
    if (userIds.length > 0) {
        const { data: byUserData, error: byUserError } = await supabase
            .from('lesson_progress')
            .select('lesson_id, user_id')
            .in('user_id', userIds);
        if (byUserError) {
            console.error('Failed to load lesson progress (by user):', byUserError);
            return [];
        }
        for (const row of byUserData as { lesson_id: string; user_id: string }[]) {
            const key = pairKey(row.lesson_id, row.user_id);
            if (byLesson.has(key)) donePairs.add(key);
        }
    }

    return homework.map((h) => {
        const assigned = approvedByClass.get(h.class_slug) ?? [];
        return {
            id: h.id,
            classSlug: h.class_slug,
            lessonId: h.lesson_id,
            dueAt: h.due_at,
            createdAt: h.created_at,
            lessonTitleFa: titleFaByLesson.get(h.lesson_id) ?? '',
            assignedCount: assigned.length,
            doneCount: assigned.filter((uid) => donePairs.has(pairKey(h.lesson_id, uid))).length,
        };
    });
}

export async function deleteHomeworkAssignment(formData: FormData): Promise<ActionResult> {
    if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

    const parsed = z.object({ id: idSchema }).safeParse({ id: str(formData, 'id').trim() });
    if (!parsed.success) {
        console.error('deleteHomeworkAssignment validation failed:', parsed.error.flatten());
        return { success: false, message: 'delete_failed' };
    }

    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('homework_assignments')
            .delete()
            .eq('id', parsed.data.id);
        if (error) throw error;

        revalidatePath('/admin/homework');
        return { success: true, message: 'deleted' };
    } catch (error) {
        console.error('Failed to delete homework assignment:', error);
        return { success: false, message: 'delete_failed' };
    }
}

// --- Student read ---

export async function getMyHomework(): Promise<HomeworkItem[]> {
    const userId = await studentUserId();
    if (!userId) return [];

    const supabase = await createClient();
    const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('class_slug')
        .eq('user_id', userId)
        .eq('status', 'approved');
    if (enrollmentError || !enrollmentData) {
        console.error('Failed to load enrollments for homework:', enrollmentError);
        return [];
    }
    const classSlugs = [
        ...new Set((enrollmentData as { class_slug: string }[]).map((r) => r.class_slug)),
    ];
    if (classSlugs.length === 0) return [];

    const { data: homeworkData, error: homeworkError } = await supabase
        .from('homework_assignments')
        .select('*, lessons(*)')
        .in('class_slug', classSlugs)
        .order('due_at', { ascending: true });
    if (homeworkError || !homeworkData) {
        console.error('Failed to load homework:', homeworkError);
        return [];
    }
    const rows = homeworkData as HomeworkRow[];
    if (rows.length === 0) return [];

    // One fetch of the caller's completed lessons feeds every `done` flag.
    const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId);
    if (progressError) {
        console.error('Failed to load lesson progress for homework:', progressError);
        return [];
    }
    const completed = new Set(
        (progressData as { lesson_id: string }[]).map((r) => r.lesson_id)
    );

    const out: HomeworkItem[] = [];
    for (const row of rows) {
        const embedded = row.lessons;
        const lessonRow = Array.isArray(embedded) ? embedded[0] : embedded;
        if (!lessonRow) continue;
        out.push({
            id: row.id,
            classSlug: row.class_slug,
            lessonId: row.lesson_id,
            dueAt: row.due_at,
            createdAt: row.created_at,
            lesson: mapLessonRow(lessonRow),
            done: completed.has(row.lesson_id),
        });
    }
    return out;
}
