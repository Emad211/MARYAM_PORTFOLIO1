'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, createPublicClient } from '@/lib/supabase/server';
import { isAdminRequest, studentUserId } from '@/lib/supabase/auth-guard';
import type {
    OpenTask,
    RubricScores,
    SubmissionAnnotation,
    SubmissionRecord,
    SubmissionWithTask,
} from '@/lib/types';

// Every action returns this shape (mirrors enrollment-actions). `message` is a
// stable key the client maps to a localized string, not user-facing prose.
// `id` is populated on successful inserts (house pattern).
type ActionResult = { success: boolean; message: string; id?: string };

/** Submission plus its inline teacher annotations. */
export type SubmissionWithAnnotations = SubmissionWithTask & {
    annotations: SubmissionAnnotation[];
};

// ---------------------------------------------------------------------------
// Row shapes — mirror the live migration (no generated DB types in this repo)
// ---------------------------------------------------------------------------

interface TaskRow {
    id: string;
    lesson_id: string;
    skill: string;
    prompt: OpenTask['prompt'];
    time_limit_min: number | null;
    word_min: number | null;
    word_max: number | null;
    sort_order: number;
}

interface SubmissionRow {
    id: string;
    task_id: string;
    kind: string;
    body: string | null;
    file_path: string | null;
    teacher_feedback: string | null;
    rubric_scores: RubricScores | null;
    status: string;
    submitted_at: string;
    decided_at: string | null;
    // FK embed `tasks(*)` — object on modern PostgREST, array on some paths.
    tasks: TaskRow | TaskRow[] | null;
}

interface SubmissionStatusRow {
    id: string;
    user_id: string;
    status: string;
}

interface AnnotationRow {
    id: string;
    submission_id: string;
    start_offset: number;
    end_offset: number;
    comment: string;
    created_at: string;
}

// ---------------------------------------------------------------------------
// Shared mappers / helpers
// ---------------------------------------------------------------------------

function mapTaskRow(row: TaskRow): OpenTask {
    return {
        id: row.id,
        lessonId: row.lesson_id,
        skill: row.skill === 'sprechen' ? 'sprechen' : 'schreiben',
        prompt: row.prompt,
        ...(row.time_limit_min != null ? { timeLimitMin: row.time_limit_min } : {}),
        ...(row.word_min != null ? { wordMin: row.word_min } : {}),
        ...(row.word_max != null ? { wordMax: row.word_max } : {}),
        sortOrder: row.sort_order,
    };
}

function mapSubmissionRow(row: SubmissionRow, task: OpenTask): SubmissionWithTask {
    const record: SubmissionRecord = {
        id: row.id,
        taskId: row.task_id,
        kind: row.kind === 'audio' ? 'audio' : 'text',
        ...(row.body != null ? { body: row.body } : {}),
        ...(row.file_path != null ? { filePath: row.file_path } : {}),
        ...(row.teacher_feedback != null ? { teacherFeedback: row.teacher_feedback } : {}),
        ...(row.rubric_scores != null ? { rubricScores: row.rubric_scores } : {}),
        status: row.status === 'graded' ? 'graded' : 'pending',
        submittedAt: row.submitted_at,
        ...(row.decided_at != null ? { decidedAt: row.decided_at } : {}),
    };
    return { ...record, task };
}

function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function mapAnnotationRow(row: AnnotationRow): SubmissionAnnotation {
    return {
        id: row.id,
        submissionId: row.submission_id,
        startOffset: row.start_offset,
        endOffset: row.end_offset,
        comment: row.comment,
        createdAt: row.created_at,
    };
}

/** A graded submission must never be overwritten. Depending on how the RLS
 *  update policy is shaped, resubmitting over a graded row either raises or
 *  silently matches zero rows — so check the prior status explicitly. */
async function findOwnSubmissionStatus(
    supabase: Awaited<ReturnType<typeof createClient>>,
    taskId: string,
    userId: string
): Promise<string | null> {
    const { data } = await supabase
        .from('submissions')
        .select('status')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .maybeSingle();
    return (data as { status?: string } | null)?.status ?? null;
}

// ---------------------------------------------------------------------------
// Public reads (cookie-less client → ISR-safe; tasks are anon-readable)
// ---------------------------------------------------------------------------

export async function getTasksForLesson(lessonId: string): Promise<OpenTask[]> {
    const supabase = createPublicClient();
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('sort_order');

    if (error) {
        console.error(`Failed to load tasks for lesson '${lessonId}':`, error);
        return [];
    }
    return ((data ?? []) as TaskRow[]).map(mapTaskRow);
}

// ---------------------------------------------------------------------------
// Student reads / writes (request-bound client → RLS applies)
// ---------------------------------------------------------------------------

export async function getMySubmissions(): Promise<SubmissionWithAnnotations[]> {
    const userId = await studentUserId();
    if (!userId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('submissions')
        .select('*, tasks(*)')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Failed to load submissions:', error);
        return [];
    }

    const rows = (data ?? []) as SubmissionRow[];

    // Inline annotations ride along; the owner-or-admin read policy matches
    // the submission rows above, so RLS scopes them identically.
    const annotationsBySubmission = new Map<string, SubmissionAnnotation[]>();
    const submissionIds = rows.map((r) => r.id);
    if (submissionIds.length > 0) {
        const { data: annotationData, error: annotationError } = await supabase
            .from('submission_annotations')
            .select('*')
            .in('submission_id', submissionIds)
            .order('created_at', { ascending: true });
        if (annotationError) {
            // Non-fatal: submissions render without annotations.
            console.error('Failed to load submission annotations:', annotationError);
        } else {
            for (const row of (annotationData ?? []) as AnnotationRow[]) {
                const list = annotationsBySubmission.get(row.submission_id) ?? [];
                list.push(mapAnnotationRow(row));
                annotationsBySubmission.set(row.submission_id, list);
            }
        }
    }

    const out: SubmissionWithAnnotations[] = [];
    for (const raw of rows) {
        const embedded = raw.tasks;
        const taskRow = Array.isArray(embedded) ? embedded[0] : embedded;
        if (!taskRow) continue;
        out.push({
            ...mapSubmissionRow(raw, mapTaskRow(taskRow)),
            annotations: annotationsBySubmission.get(raw.id) ?? [],
        });
    }
    return out;
}

const writingSchema = z.object({
    taskId: z.string().uuid(),
    body: z.string().trim().min(1).max(20000),
});

export async function submitWritingTask(formData: FormData): Promise<ActionResult> {
    const userId = await studentUserId();
    if (!userId) return { success: false, message: 'unauthorized' };

    const parsed = writingSchema.safeParse({
        taskId: formData.get('taskId'),
        body: formData.get('body'),
    });
    if (!parsed.success) return { success: false, message: 'invalid_input' };
    const { taskId, body } = parsed.data;

    // The task must exist and be a writing task (public read — anon-safe).
    const pub = createPublicClient();
    const { data: task } = await pub
        .from('tasks')
        .select('skill, word_min, word_max')
        .eq('id', taskId)
        .maybeSingle();
    const limits = task as Pick<TaskRow, 'skill' | 'word_min' | 'word_max'> | null;
    if (!limits || limits.skill !== 'schreiben') {
        return { success: false, message: 'not_found' };
    }

    // Soft length floor; word_max stays advisory and is left to the UI.
    if (limits.word_min != null && countWords(body) < limits.word_min) {
        return { success: false, message: 'too_short' };
    }

    const supabase = await createClient();
    if ((await findOwnSubmissionStatus(supabase, taskId, userId)) === 'graded') {
        return { success: false, message: 'already_graded' };
    }

    try {
        // Upsert on (task_id, user_id): a resubmission flips the same row back
        // to pending and clears stale decision columns. RLS permits this only
        // while the row is still pending and feedback columns are null.
        const { error } = await supabase.from('submissions').upsert(
            {
                task_id: taskId,
                user_id: userId,
                kind: 'text',
                body,
                status: 'pending',
                teacher_feedback: null,
                rubric_scores: null,
                decided_at: null,
            },
            { onConflict: 'task_id,user_id' }
        );
        if (error) throw error;

        revalidatePath('/dashboard');
        return { success: true, message: 'submitted' };
    } catch (error) {
        console.error('Failed to submit writing task:', error);
        return { success: false, message: 'submit_failed' };
    }
}

const speakingSchema = z.object({
    taskId: z.string().uuid(),
    filePath: z.string().min(1).max(500),
});

export async function submitSpeakingTask(formData: FormData): Promise<ActionResult> {
    const userId = await studentUserId();
    if (!userId) return { success: false, message: 'unauthorized' };

    const parsed = speakingSchema.safeParse({
        taskId: formData.get('taskId'),
        filePath: formData.get('filePath'),
    });
    if (!parsed.success) return { success: false, message: 'invalid_input' };
    const { taskId, filePath } = parsed.data;

    // SECURITY: the client may only reference objects inside its own storage
    // folder (`<uid>/…`). Anything else — planting paths into another user's
    // folder or pointing at foreign objects — is rejected before any DB work.
    if (!filePath.startsWith(`${userId}/`) || filePath.includes('..')) {
        return { success: false, message: 'forbidden' };
    }

    const pub = createPublicClient();
    const { data: task } = await pub
        .from('tasks')
        .select('skill')
        .eq('id', taskId)
        .maybeSingle();
    if (!task || (task as Pick<TaskRow, 'skill'>).skill !== 'sprechen') {
        return { success: false, message: 'not_found' };
    }

    const supabase = await createClient();
    if ((await findOwnSubmissionStatus(supabase, taskId, userId)) === 'graded') {
        return { success: false, message: 'already_graded' };
    }

    try {
        const { error } = await supabase.from('submissions').upsert(
            {
                task_id: taskId,
                user_id: userId,
                kind: 'audio',
                body: null,
                file_path: filePath,
                status: 'pending',
                teacher_feedback: null,
                rubric_scores: null,
                decided_at: null,
            },
            { onConflict: 'task_id,user_id' }
        );
        if (error) throw error;

        revalidatePath('/dashboard');
        return { success: true, message: 'submitted' };
    } catch (error) {
        console.error('Failed to submit speaking task:', error);
        return { success: false, message: 'submit_failed' };
    }
}

// ---------------------------------------------------------------------------
// Teacher grading + signed audio playback (teacher's own session → RLS admin)
// ---------------------------------------------------------------------------

const gradeSchema = z.object({
    submissionId: z.string().uuid(),
    feedback: z.string().trim().min(1).max(5000),
    wirkung: z.coerce.number().int().min(1).max(5),
    aufgabe: z.coerce.number().int().min(1).max(5),
    sprache: z.coerce.number().int().min(1).max(5),
});

export async function gradeSubmission(formData: FormData): Promise<ActionResult> {
    if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

    const parsed = gradeSchema.safeParse({
        submissionId: formData.get('submissionId'),
        feedback: formData.get('feedback'),
        wirkung: formData.get('wirkung'),
        aufgabe: formData.get('aufgabe'),
        sprache: formData.get('sprache'),
    });
    if (!parsed.success) return { success: false, message: 'invalid_input' };
    const { submissionId, feedback, wirkung, aufgabe, sprache } = parsed.data;

    const supabase = await createClient();

    // Owner id feeds the notification; also distinguishes "never existed"
    // from "already graded" below.
    const { data: existing, error: fetchErr } = await supabase
        .from('submissions')
        .select('id, user_id, status')
        .eq('id', submissionId)
        .maybeSingle();
    if (fetchErr) {
        console.error('Failed to load submission for grading:', fetchErr);
        return { success: false, message: 'grade_failed' };
    }
    const target = existing as SubmissionStatusRow | null;
    if (!target) return { success: false, message: 'not_found' };

    // `.eq('status', 'pending')` guards double-grading: once graded, the
    // update matches nothing instead of overwriting the decision.
    const { data: updated, error: updateErr } = await supabase
        .from('submissions')
        .update({
            status: 'graded',
            teacher_feedback: feedback,
            rubric_scores: { wirkung, aufgabe, sprache },
            decided_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .eq('status', 'pending')
        .select('id');
    if (updateErr) {
        console.error('Failed to grade submission:', updateErr);
        return { success: false, message: 'grade_failed' };
    }
    if (!updated || updated.length === 0) {
        return { success: false, message: 'not_found' };
    }

    // Notify the student. The grade is already committed, so a failed
    // notification must not fail the action — log and continue.
    const { error: notifErr } = await supabase.from('notifications').insert({
        user_id: target.user_id,
        type: 'submission_graded',
        payload: { submissionId, preview: feedback.slice(0, 120) },
    });
    if (notifErr) {
        console.error('Failed to insert grading notification:', notifErr);
    }

    revalidatePath('/admin/submissions');
    revalidatePath('/dashboard');
    return { success: true, message: 'graded' };
}

export async function getSubmissionAudioUrl(submissionId: string): Promise<string | null> {
    if (!(await isAdminRequest())) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('submissions')
        .select('file_path')
        .eq('id', submissionId)
        .maybeSingle();
    if (error) {
        console.error('Failed to load audio submission:', error);
        return null;
    }
    const filePath = (data as { file_path?: string | null } | null)?.file_path;
    if (!filePath) return null;

    const { data: signed, error: signErr } = await supabase.storage
        .from('submissions')
        .createSignedUrl(filePath, 3600);
    if (signErr) {
        console.error('Failed to sign submission audio URL:', signErr);
        return null;
    }
    return signed?.signedUrl ?? null;
}

// ---------------------------------------------------------------------------
// Inline annotations on audio/text submissions (admin authoring)
// ---------------------------------------------------------------------------

export async function getSubmissionAnnotations(
    submissionId: string
): Promise<SubmissionAnnotation[]> {
    if (!(await isAdminRequest())) return [];

    const parsed = z.string().uuid().safeParse(submissionId);
    if (!parsed.success) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('submission_annotations')
        .select('*')
        .eq('submission_id', parsed.data)
        .order('created_at', { ascending: true });
    if (error) {
        console.error(`Failed to load annotations for submission '${submissionId}':`, error);
        return [];
    }
    return ((data ?? []) as AnnotationRow[]).map(mapAnnotationRow);
}

const annotationSchema = z
    .object({
        submissionId: z.string().uuid(),
        startOffset: z.coerce.number().int().min(0).max(100000),
        endOffset: z.coerce.number().int().min(0).max(100000),
        comment: z.string().trim().min(1).max(1000),
    })
    .refine((value) => value.startOffset <= value.endOffset, {
        message: 'startOffset must be <= endOffset',
    });

export async function saveSubmissionAnnotation(formData: FormData): Promise<ActionResult> {
    if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

    const parsed = annotationSchema.safeParse({
        submissionId: formData.get('submissionId'),
        startOffset: formData.get('startOffset'),
        endOffset: formData.get('endOffset'),
        comment: formData.get('comment'),
    });
    if (!parsed.success) {
        console.error('saveSubmissionAnnotation validation failed:', parsed.error.flatten());
        return { success: false, message: 'invalid_input' };
    }
    const { submissionId, startOffset, endOffset, comment } = parsed.data;

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('submission_annotations')
            .insert({
                submission_id: submissionId,
                start_offset: startOffset,
                end_offset: endOffset,
                comment,
            })
            .select('id')
            .single();
        if (error) throw error;
        const newId = (data as { id: string } | null)?.id;

        revalidatePath('/admin/submissions');
        return { success: true, message: 'saved', ...(newId ? { id: newId } : {}) };
    } catch (error) {
        console.error('Failed to save submission annotation:', error);
        return { success: false, message: 'save_failed' };
    }
}

export async function deleteSubmissionAnnotation(formData: FormData): Promise<ActionResult> {
    if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

    const parsed = z
        .object({ id: z.string().uuid() })
        .safeParse({ id: formData.get('id') });
    if (!parsed.success) {
        console.error('deleteSubmissionAnnotation validation failed:', parsed.error.flatten());
        return { success: false, message: 'delete_failed' };
    }

    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('submission_annotations')
            .delete()
            .eq('id', parsed.data.id);
        if (error) throw error;

        revalidatePath('/admin/submissions');
        return { success: true, message: 'deleted' };
    } catch (error) {
        console.error('Failed to delete submission annotation:', error);
        return { success: false, message: 'delete_failed' };
    }
}
