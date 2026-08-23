'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createPublicClient } from '@/lib/supabase/server';
import { studentUserId } from '@/lib/supabase/auth-guard';
import type {
    CurriculumModule,
    ClassProgress,
    LmsLesson,
    LmsQuestion,
    LmsSkill,
    LocalizedString,
    MatchPayload,
    McPayload,
    McAnswer,
    JnlAnswer,
    MatchAnswer,
    QuestionType,
} from '@/lib/types';

// Every mutation returns this shape (mirrors enrollment-actions). `message`
// is a stable key the client maps to a localized string, not user-facing prose.
export type ActionResult = { success: boolean; message: string };

// ---------------------------------------------------------------------------
// Raw DB row shapes (JSONB columns arrive untyped; mappers live inline here
// because lms rows are not part of lib/supabase/mappers.ts).
// ---------------------------------------------------------------------------

interface ModuleRow {
    id: string;
    class_slug: string;
    title: unknown;
    sort_order: number;
}

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

/** Shape returned by the SECURITY DEFINER rpc get_lesson_exercises —
 *  deliberately carries no answer_key column. */
interface ExerciseRow {
    id: string;
    type: string;
    prompt: unknown;
    payload: unknown;
    points: number;
}

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

function mapExerciseRow(row: ExerciseRow): LmsQuestion {
    return {
        id: row.id,
        type: row.type as QuestionType,
        prompt: row.prompt as LocalizedString,
        ...(row.payload ? { payload: row.payload as McPayload | MatchPayload } : {}),
        points: row.points,
    };
}

// ---------------------------------------------------------------------------
// Curriculum reads — public tables, cookie-less client (ISR-safe).
// ---------------------------------------------------------------------------

export async function getCurriculum(classSlug: string): Promise<CurriculumModule[]> {
    const pub = createPublicClient();

    const { data: moduleData, error: moduleError } = await pub
        .from('modules')
        .select('*')
        .eq('class_slug', classSlug)
        .order('sort_order');
    if (moduleError || !moduleData) {
        console.error(`Failed to load modules for '${classSlug}':`, moduleError);
        return [];
    }
    const modules = moduleData as ModuleRow[];
    if (modules.length === 0) return [];

    const moduleIds = modules.map((m) => m.id);
    const { data: lessonData, error: lessonError } = await pub
        .from('lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('sort_order');
    if (lessonError || !lessonData) {
        console.error(`Failed to load lessons for '${classSlug}':`, lessonError);
        return [];
    }

    const lessonsByModule = new Map<string, LmsLesson[]>();
    for (const row of lessonData as LessonRow[]) {
        const list = lessonsByModule.get(row.module_id) ?? [];
        list.push(mapLessonRow(row));
        lessonsByModule.set(row.module_id, list);
    }

    return modules.map((m) => ({
        id: m.id,
        classSlug: m.class_slug,
        title: m.title as LocalizedString,
        sortOrder: m.sort_order,
        lessons: lessonsByModule.get(m.id) ?? [],
    }));
}

export async function getLessonPage(
    lessonId: string
): Promise<{ lesson: LmsLesson; moduleTitle: LocalizedString; classSlug: string } | null> {
    const pub = createPublicClient();

    const { data: lessonData, error: lessonError } = await pub
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();
    if (lessonError || !lessonData) {
        if (lessonError) console.error(`Failed to load lesson '${lessonId}':`, lessonError);
        return null;
    }
    const lessonRow = lessonData as LessonRow;

    const { data: moduleData, error: moduleError } = await pub
        .from('modules')
        .select('title, class_slug')
        .eq('id', lessonRow.module_id)
        .maybeSingle();
    if (moduleError || !moduleData) {
        if (moduleError) console.error(`Failed to load module for lesson '${lessonId}':`, moduleError);
        return null;
    }
    const moduleRow = moduleData as { title: unknown; class_slug: string };

    return {
        lesson: mapLessonRow(lessonRow),
        moduleTitle: moduleRow.title as LocalizedString,
        classSlug: moduleRow.class_slug,
    };
}

// ---------------------------------------------------------------------------
// Progress — request-bound client (RLS scopes rows to the caller).
// ---------------------------------------------------------------------------

export async function getStudentProgress(): Promise<Record<string, boolean>> {
    const userId = await studentUserId();
    if (!userId) return {};

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId);
    if (error) {
        console.error('Failed to load lesson progress:', error);
        return {};
    }

    const result: Record<string, boolean> = {};
    for (const row of (data ?? []) as { lesson_id: string }[]) {
        result[row.lesson_id] = true;
    }
    return result;
}

export async function getClassProgress(): Promise<Record<string, ClassProgress>> {
    const userId = await studentUserId();
    if (!userId) return {};

    const pub = createPublicClient();
    const { data: moduleData, error: moduleError } = await pub.from('modules').select('id, class_slug');
    if (moduleError || !moduleData) {
        console.error('Failed to load modules for progress:', moduleError);
        return {};
    }
    const { data: lessonData, error: lessonError } = await pub.from('lessons').select('id, module_id');
    if (lessonError || !lessonData) {
        console.error('Failed to load lessons for progress:', lessonError);
        return {};
    }

    const classByModule = new Map<string, string>();
    const totals = new Map<string, number>();
    for (const m of moduleData as ModuleRow[]) {
        classByModule.set(m.id, m.class_slug);
        totals.set(m.class_slug, (totals.get(m.class_slug) ?? 0) + 1);
    }

    const supabase = await createClient();
    const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId);
    if (progressError || !progressData) {
        console.error('Failed to load lesson progress:', progressError);
        return {};
    }
    const completed = new Set(
        (progressData as { lesson_id: string }[]).map((r) => r.lesson_id)
    );

    const done = new Map<string, number>();
    for (const l of lessonData as { id: string; module_id: string }[]) {
        if (!completed.has(l.id)) continue;
        const slug = classByModule.get(l.module_id);
        if (slug) done.set(slug, (done.get(slug) ?? 0) + 1);
    }

    const result: Record<string, ClassProgress> = {};
    for (const [slug, total] of totals) {
        result[slug] = { total, done: done.get(slug) ?? 0 };
    }
    return result;
}

export async function toggleLessonComplete(
    lessonId: string,
    completed: boolean
): Promise<ActionResult> {
    const userId = await studentUserId();
    if (!userId) return { success: false, message: 'unauthorized' };

    try {
        const supabase = await createClient();
        if (completed) {
            // Composite PK (user_id, lesson_id) makes this idempotent.
            const { error } = await supabase
                .from('lesson_progress')
                .upsert({ user_id: userId, lesson_id: lessonId });
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('lesson_progress')
                .delete()
                .eq('user_id', userId)
                .eq('lesson_id', lessonId);
            if (error) throw error;
        }
        revalidatePath('/dashboard');
        return { success: true, message: 'toggled' };
    } catch (error) {
        console.error('Failed to toggle lesson completion:', error);
        return { success: false, message: 'toggle_failed' };
    }
}

// ---------------------------------------------------------------------------
// Exercises & grading — students reach the admin-only questions table ONLY
// through the SECURITY DEFINER rpcs below; answer_key never leaves the DB.
// ---------------------------------------------------------------------------

export async function getLessonExercises(lessonId: string): Promise<LmsQuestion[]> {
    const userId = await studentUserId();
    if (!userId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_lesson_exercises', {
        p_lesson_id: lessonId,
    });
    if (error) {
        console.error(`Failed to load exercises for lesson '${lessonId}':`, error);
        return [];
    }
    return ((data ?? []) as ExerciseRow[]).map(mapExerciseRow);
}

function isValidAnswerShape(answer: McAnswer | JnlAnswer | MatchAnswer): boolean {
    if ('correct' in answer) {
        return typeof answer.correct === 'string' && answer.correct.length > 0;
    }
    if ('mapping' in answer) {
        return Object.values(answer.mapping).every((v) => typeof v === 'string');
    }
    return false;
}

export async function submitAnswer(
    questionId: string,
    answer: McAnswer | JnlAnswer | MatchAnswer
): Promise<{ success: boolean; isCorrect?: boolean; message: string }> {
    const userId = await studentUserId();
    if (!userId) return { success: false, message: 'unauthorized' };

    if (!questionId || !isValidAnswerShape(answer)) {
        return { success: false, message: 'invalid_input' };
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc('grade_attempt', {
            p_question_id: questionId,
            p_answer: answer,
        });
        if (error) {
            if (/auth/i.test(error.message)) {
                return { success: false, message: 'unauthorized' };
            }
            throw error;
        }
        const isCorrect: boolean = (data as boolean | null) ?? false;
        return { success: true, isCorrect, message: 'submitted' };
    } catch (error) {
        console.error('Failed to grade attempt:', error);
        return { success: false, message: 'submit_failed' };
    }
}
