import { createClient } from "@/lib/supabase/server";
import { GradingQueue, type AdminSubmissionItem } from "@/components/admin/grading-queue";

// Always render live: submissions flip pending→graded as the teacher works and
// students submit at any time; reads go through the request-bound client so
// RLS (admin select policy) is exercised for real.
export const dynamic = 'force-dynamic';

// --- Local row shapes (hand-mapped, no generated Database types in this repo) ---

interface EmbeddedTaskRow {
    skill: string;
    prompt: unknown; // jsonb LocalizedString — narrowed defensively below
    time_limit_min: number | null;
    word_min: number | null;
    word_max: number | null;
}

interface SubmissionRow {
    id: string;
    user_id: string;
    kind: string;
    body: string | null;
    teacher_feedback: string | null;
    rubric_scores: Record<string, unknown> | null;
    status: string;
    submitted_at: string;
    // supabase-js infers the FK embed as an array; PostgREST returns an object.
    tasks: EmbeddedTaskRow[] | EmbeddedTaskRow | null;
}

interface ProfileRow {
    id: string;
    name: string | null;
}

// --- jsonb narrowing helpers (same trust level as cms-store's `as T`, but checked) ---

function localizedFromJson(raw: unknown): { en: string; de: string; fa: string } {
    if (!raw || typeof raw !== 'object') return { en: '', de: '', fa: '' };
    const rec = raw as Record<string, unknown>;
    return {
        en: typeof rec['en'] === 'string' ? rec['en'] : '',
        de: typeof rec['de'] === 'string' ? rec['de'] : '',
        fa: typeof rec['fa'] === 'string' ? rec['fa'] : '',
    };
}

function intScore(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isInteger(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isInteger(parsed) ? parsed : undefined;
    }
    return undefined;
}

function rubricFromJson(
    raw: Record<string, unknown> | null
): { wirkung: number; aufgabe: number; sprache: number } | undefined {
    if (!raw) return undefined;
    const wirkung = intScore(raw['wirkung']);
    const aufgabe = intScore(raw['aufgabe']);
    const sprache = intScore(raw['sprache']);
    if (wirkung === undefined || aufgabe === undefined || sprache === undefined) return undefined;
    return { wirkung, aufgabe, sprache };
}

function firstTask(tasks: SubmissionRow['tasks']): EmbeddedTaskRow | null {
    if (!tasks) return null;
    return Array.isArray(tasks) ? (tasks[0] ?? null) : tasks;
}

export default async function SubmissionsPage() {
    const supabase = await createClient();

    // Two separate queries merged in JS: submissions.user_id references
    // auth.users (not profiles), so there is no FK to embed names through.
    // Fetch all rows, sort pending-first client-side, cap at 200.
    const { data: submissionData, error: submissionErr } = await supabase
        .from('submissions')
        .select(
            'id, task_id, user_id, kind, body, teacher_feedback, rubric_scores, status, submitted_at, tasks(skill, prompt, time_limit_min, word_min, word_max)'
        )
        .limit(200);
    if (submissionErr) {
        console.error('Failed to load submissions for grading queue:', submissionErr);
    }

    const rows = ((submissionData ?? []) as SubmissionRow[]).slice();

    // Pending first, then newest submission wins within each group.
    rows.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
    });

    // Bulk student-name lookup scoped to the fetched submissions.
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const nameById = new Map<string, string>();
    if (userIds.length > 0) {
        const { data: profileRows, error: profileErr } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
        if (profileErr) {
            console.error('Failed to load student names for grading queue:', profileErr);
        }
        for (const p of (profileRows ?? []) as ProfileRow[]) {
            nameById.set(p.id, p.name ?? '');
        }
    }

    const items: AdminSubmissionItem[] = rows.map((row) => {
        const task = firstTask(row.tasks);
        const rubricScores = rubricFromJson(row.rubric_scores);
        const studentName = nameById.get(row.user_id);
        return {
            id: row.id,
            kind: row.kind === 'audio' ? ('audio' as const) : ('text' as const),
            ...(row.body ? { body: row.body } : {}),
            status: row.status === 'graded' ? ('graded' as const) : ('pending' as const),
            submittedAt: row.submitted_at,
            ...(row.teacher_feedback ? { teacherFeedback: row.teacher_feedback } : {}),
            ...(rubricScores ? { rubricScores } : {}),
            studentName: studentName && studentName.trim() !== '' ? studentName : 'Student',
            task: {
                skill:
                    task?.skill === 'sprechen'
                        ? ('sprechen' as const)
                        : ('schreiben' as const),
                prompt: localizedFromJson(task?.prompt),
                ...(task?.time_limit_min != null ? { timeLimitMin: task.time_limit_min } : {}),
                ...(task?.word_min != null ? { wordMin: task.word_min } : {}),
                ...(task?.word_max != null ? { wordMax: task.word_max } : {}),
            },
        };
    });

    return <GradingQueue items={items} />;
}
