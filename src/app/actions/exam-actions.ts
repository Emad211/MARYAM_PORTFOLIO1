'use server';

import { createClient, createPublicClient } from '@/lib/supabase/server';
import { studentUserId } from '@/lib/supabase/auth-guard';
import { getTdnBand } from '@/lib/exam-blueprints';
import type {
    JnlAnswer,
    LmsQuestion,
    LocalizedString,
    MatchAnswer,
    MatchPayload,
    McAnswer,
    McPayload,
    MockExamSummary,
    MockHistoryEntry,
    MockSectionKind,
    MockSectionRunner,
    MockSessionInfo,
    MockSessionResults,
    MockSessionStatus,
    QuestionType,
    ReviewItem,
    SectionOutcome,
} from '@/lib/types';

// Same shape as enrollment/lms actions; `message` is a stable i18n key the
// client maps to localized text, never user-facing prose.
type ActionResult = { success: boolean; message: string };

// ---------------------------------------------------------------------------
// Raw DB row shapes (JSONB arrives untyped; mappers stay inline like lms-actions)
// ---------------------------------------------------------------------------

interface MockExamRow {
    id: string;
    code: string;
    title: unknown;
    is_active: boolean;
}

interface MockSectionDbRow {
    id: string;
    exam_id: string;
    section: string;
    duration_min: number;
    sort_order: number;
}

/** Row of the SECURITY DEFINER rpc get_section_question_counts. */
interface SectionCountRow {
    section_id: string;
    q_count: number;
}

/**
 * Direct questions-table read. The table carries no anon grant and its select
 * policy is admin-only, so this shape is filled through the request-bound
 * client and RLS decides visibility. answer_key is never selected.
 */
interface RunnerQuestionRow {
    id: string;
    section_id: string | null;
    type: string;
    prompt: unknown;
    payload: unknown;
    points: number;
    audio_path: string | null;
    plays_allowed: number | null;
}

/** Row of the SECURITY DEFINER rpc get_session_review (closed sessions only). */
interface ReviewResultRow {
    question_id: string;
    section_id: string | null;
    type: string;
    prompt: unknown;
    payload: unknown;
    audio_path: string | null;
    plays_allowed: number | null;
    given_answer: unknown;
    is_correct: boolean;
    correct_answer: unknown;
}

/** Row of the SECURITY DEFINER rpc submit_section_answers. */
interface SubmitResultRow {
    question_id: string;
    is_correct: boolean;
}

function mapQuestionRow(row: RunnerQuestionRow): LmsQuestion {
    return {
        id: row.id,
        type: row.type as QuestionType,
        prompt: row.prompt as LocalizedString,
        ...(row.payload ? { payload: row.payload as McPayload | MatchPayload } : {}),
        ...(row.audio_path ? { audioPath: row.audio_path } : {}),
        ...(row.plays_allowed && row.plays_allowed > 0 ? { playsAllowed: row.plays_allowed } : {}),
        points: row.points,
    };
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

/** Defensive union cast for RPC-returned answers; null when shape mismatches. */
function castAnswer(
    type: QuestionType,
    value: unknown
): McAnswer | JnlAnswer | MatchAnswer | null {
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    if (type === 'match') {
        if (!record.mapping || typeof record.mapping !== 'object') return null;
        const mapping: Record<string, string> = {};
        for (const [key, entry] of Object.entries(record.mapping as Record<string, unknown>)) {
            if (typeof entry !== 'string') return null;
            mapping[key] = entry;
        }
        return { mapping };
    }
    if (typeof record.correct !== 'string' || record.correct.length === 0) return null;
    if (type === 'jnl') {
        return record.correct === 'ja' || record.correct === 'nein' || record.correct === 'nichts'
            ? { correct: record.correct }
            : null;
    }
    return { correct: record.correct };
}

// ---------------------------------------------------------------------------
// Exam catalog — public tables, cookie-less client (ISR-safe)
// ---------------------------------------------------------------------------

export async function listActiveMockExams(): Promise<MockExamSummary[]> {
    const pub = createPublicClient();

    const { data: examData, error: examError } = await pub
        .from('mock_exams')
        .select('id, code, title, is_active')
        .eq('is_active', true)
        .order('created_at');
    if (examError || !examData) {
        console.error('Failed to load active mock exams:', examError);
        return [];
    }
    const exams = examData as MockExamRow[];
    if (exams.length === 0) return [];

    const examIds = exams.map((e) => e.id);
    const { data: sectionData, error: sectionError } = await pub
        .from('mock_sections')
        .select('exam_id, duration_min')
        .in('exam_id', examIds);
    if (sectionError || !sectionData) {
        console.error('Failed to load mock exam sections:', sectionError);
        return [];
    }

    const durationByExam = new Map<string, number>();
    for (const s of sectionData as { exam_id: string; duration_min: number }[]) {
        durationByExam.set(s.exam_id, (durationByExam.get(s.exam_id) ?? 0) + s.duration_min);
    }

    const result: MockExamSummary[] = [];
    for (const exam of exams) {
        const { data: counts, error: countError } = await pub.rpc('get_section_question_counts', {
            p_exam_id: exam.id,
        });
        if (countError || !counts) {
            console.error(`Failed to load question counts for exam '${exam.id}':`, countError);
            continue;
        }
        const questionCount = (counts as SectionCountRow[]).reduce((sum, c) => sum + c.q_count, 0);
        result.push({
            id: exam.id,
            code: exam.code,
            title: exam.title as LocalizedString,
            isActive: exam.is_active,
            totalDurationMin: durationByExam.get(exam.id) ?? 0,
            questionCount,
        });
    }
    return result;
}

// ---------------------------------------------------------------------------
// Session lifecycle — request-bound client (RLS applies)
// ---------------------------------------------------------------------------

export async function startMockSession(
    examId: string
): Promise<{ success: boolean; message: string; sessionId?: string; expiresAt?: string }> {
    const userId = await studentUserId();
    if (!userId) return { success: false, message: 'unauthorized' };

    const pub = createPublicClient();
    const { data: examRow, error: examError } = await pub
        .from('mock_exams')
        .select('is_active')
        .eq('id', examId)
        .maybeSingle();
    if (examError) {
        console.error(`Failed to load mock exam '${examId}':`, examError);
        return { success: false, message: 'start_failed' };
    }
    if (!examRow || !(examRow as { is_active: boolean }).is_active) {
        return { success: false, message: 'not_found' };
    }

    try {
        const supabase = await createClient();

        // Retake hygiene: stale in_progress sessions become abandoned first.
        const { error: abandonError } = await supabase
            .from('mock_sessions')
            .update({ status: 'abandoned' })
            .eq('user_id', userId)
            .eq('exam_id', examId)
            .eq('status', 'in_progress');
        if (abandonError) throw abandonError;

        const { data: sectionData, error: sectionError } = await pub
            .from('mock_sections')
            .select('duration_min')
            .eq('exam_id', examId);
        if (sectionError || !sectionData) {
            throw sectionError ?? new Error('sections unavailable');
        }

        const totalMin = (sectionData as { duration_min: number }[]).reduce(
            (sum, s) => sum + s.duration_min,
            0
        );
        if (totalMin <= 0) return { success: false, message: 'empty_exam' };

        const startedAt = new Date();
        const { data: inserted, error: insertError } = await supabase
            .from('mock_sessions')
            .insert({
                user_id: userId,
                exam_id: examId,
                status: 'in_progress',
                started_at: startedAt.toISOString(),
                expires_at: new Date(startedAt.getTime() + totalMin * 60000).toISOString(),
            })
            .select('id, expires_at')
            .single();
        if (insertError || !inserted) {
            throw insertError ?? new Error('session insert returned no row');
        }
        const row = inserted as { id: string; expires_at: string };
        return { success: true, message: 'started', sessionId: row.id, expiresAt: row.expires_at };
    } catch (error) {
        console.error('Failed to start mock session:', error);
        return { success: false, message: 'start_failed' };
    }
}

export async function getSessionInfo(sessionId: string): Promise<MockSessionInfo | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('mock_sessions')
        .select('id, exam_id, status, started_at, expires_at')
        .eq('id', sessionId)
        .maybeSingle();
    if (error || !data) {
        if (error) console.error(`Failed to load mock session '${sessionId}':`, error);
        return null;
    }
    const row = data as {
        id: string;
        exam_id: string;
        status: string;
        started_at: string;
        expires_at: string;
    };
    return {
        id: row.id,
        examId: row.exam_id,
        status: row.status as MockSessionStatus,
        startedAt: row.started_at,
        expiresAt: row.expires_at,
    };
}

export async function getRunnerData(
    examId: string
): Promise<{ sections: MockSectionRunner[] } | null> {
    const pub = createPublicClient();

    const { data: sectionData, error: sectionError } = await pub
        .from('mock_sections')
        .select('id, section, duration_min, sort_order')
        .eq('exam_id', examId)
        .order('sort_order');
    if (sectionError || !sectionData) {
        console.error(`Failed to load sections for mock exam '${examId}':`, sectionError);
        return null;
    }
    const sections = sectionData as MockSectionDbRow[];
    if (sections.length === 0) return { sections: [] };

    // questions has no anon grant and admin-only select, so this read goes
    // through the request-bound client and RLS decides — never the public one.
    const supabase = await createClient();
    const sectionIds = sections.map((s) => s.id);
    const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('id, section_id, type, prompt, payload, points, audio_path, plays_allowed')
        .in('section_id', sectionIds)
        .order('sort_order');
    if (questionError || !questionData) {
        console.error(`Failed to load questions for mock exam '${examId}':`, questionError);
        return null;
    }
    if (questionData.length === 0) {
        console.warn(
            `No questions visible for mock exam '${examId}' — questions select is admin-only via RLS`
        );
    }

    const bySection = new Map<string, LmsQuestion[]>();
    for (const row of questionData as RunnerQuestionRow[]) {
        if (!row.section_id) continue;
        const list = bySection.get(row.section_id) ?? [];
        list.push(mapQuestionRow(row));
        bySection.set(row.section_id, list);
    }

    return {
        sections: sections.map((s) => ({
            id: s.id,
            section: s.section as MockSectionKind,
            durationMin: s.duration_min,
            sortOrder: s.sort_order,
            questions: bySection.get(s.id) ?? [],
        })),
    };
}

// ---------------------------------------------------------------------------
// Submission — grading happens inside the SECURITY DEFINER rpc; answer_key
// never leaves the database.
// ---------------------------------------------------------------------------

export async function submitSection(
    sessionId: string,
    sectionId: string,
    answers: Array<{ questionId: string; answer: McAnswer | JnlAnswer | MatchAnswer }>
): Promise<{
    success: boolean;
    message: string;
    results?: Array<{ questionId: string; isCorrect: boolean }>;
}> {
    const userId = await studentUserId();
    if (!userId) return { success: false, message: 'unauthorized' };

    const inputValid =
        sessionId.length > 0 &&
        sectionId.length > 0 &&
        answers.length > 0 &&
        answers.every((a) => a.questionId.length > 0 && isValidAnswerShape(a.answer));
    if (!inputValid) return { success: false, message: 'invalid_input' };

    try {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc('submit_section_answers', {
            p_session_id: sessionId,
            p_answers: answers.map((a) => ({ question_id: a.questionId, answer: a.answer })),
        });
        if (error) {
            const reason = error.message;
            if (reason.includes('not_authenticated')) {
                return { success: false, message: 'unauthorized' };
            }
            if (reason.includes('session_not_found')) {
                return { success: false, message: 'not_found' };
            }
            if (reason.includes('session_closed')) {
                return { success: false, message: 'closed' };
            }
            if (reason.includes('session_expired')) {
                return { success: false, message: 'expired' };
            }
            throw error;
        }
        const results = ((data ?? []) as SubmitResultRow[]).map((r) => ({
            questionId: r.question_id,
            isCorrect: r.is_correct,
        }));
        return { success: true, message: 'submitted', results };
    } catch (error) {
        console.error('Failed to submit section answers:', error);
        return { success: false, message: 'submit_failed' };
    }
}

async function finalizeMockSession(
    sessionId: string,
    status: 'completed' | 'abandoned',
    successKey: string
): Promise<ActionResult> {
    const userId = await studentUserId();
    if (!userId) return { success: false, message: 'unauthorized' };

    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('mock_sessions')
            .update({ status, completed_at: new Date().toISOString() })
            .eq('id', sessionId)
            .eq('status', 'in_progress');
        if (error) throw error;
        return { success: true, message: successKey };
    } catch (error) {
        console.error(`Failed to finalize mock session '${sessionId}':`, error);
        return { success: false, message: 'finalize_failed' };
    }
}

export async function completeMockSession(sessionId: string): Promise<ActionResult> {
    return finalizeMockSession(sessionId, 'completed', 'completed');
}

export async function abandonMockSession(sessionId: string): Promise<ActionResult> {
    return finalizeMockSession(sessionId, 'abandoned', 'abandoned');
}

// ---------------------------------------------------------------------------
// Results & history — review data flows ONLY through the definer rpc, which
// refuses open sessions, so answer_key is reachable strictly post-close.
// ---------------------------------------------------------------------------

export async function getSessionResults(sessionId: string): Promise<MockSessionResults | null> {
    const userId = await studentUserId();
    if (!userId) return null;

    const supabase = await createClient();

    const { data: sessionData, error: sessionError } = await supabase
        .from('mock_sessions')
        .select('id, exam_id, status, completed_at')
        .eq('id', sessionId)
        .maybeSingle();
    if (sessionError || !sessionData) {
        if (sessionError) console.error(`Failed to load mock session '${sessionId}':`, sessionError);
        return null;
    }
    const session = sessionData as {
        id: string;
        exam_id: string;
        status: string;
        completed_at: string | null;
    };
    if (session.status === 'in_progress') return null;

    const { data: reviewData, error: reviewError } = await supabase.rpc('get_session_review', {
        p_session_id: sessionId,
    });
    if (reviewError || !reviewData) {
        console.error(`Failed to load review for mock session '${sessionId}':`, reviewError);
        return null;
    }
    const reviewRows = reviewData as ReviewResultRow[];

    const review: ReviewItem[] = reviewRows.map((row) => ({
        question: {
            id: row.question_id,
            type: row.type as QuestionType,
            prompt: row.prompt as LocalizedString,
            ...(row.payload ? { payload: row.payload as McPayload | MatchPayload } : {}),
            ...(row.audio_path ? { audioPath: row.audio_path } : {}),
            ...(row.plays_allowed && row.plays_allowed > 0
                ? { playsAllowed: row.plays_allowed }
                : {}),
            points: 1, // review rpc omits points; each simulator item scores 1
        },
        given: castAnswer(row.type as QuestionType, row.given_answer),
        correct: castAnswer(row.type as QuestionType, row.correct_answer),
    }));

    const pub = createPublicClient();
    const { data: sectionData, error: sectionError } = await pub
        .from('mock_sections')
        .select('id, section, sort_order')
        .eq('exam_id', session.exam_id)
        .order('sort_order');
    if (sectionError || !sectionData) {
        console.error(`Failed to load sections for results of session '${sessionId}':`, sectionError);
        return null;
    }

    const { data: countData, error: countError } = await supabase.rpc(
        'get_section_question_counts',
        { p_exam_id: session.exam_id }
    );
    if (countError || !countData) {
        console.error(`Failed to load question counts for session '${sessionId}':`, countError);
        return null;
    }
    const maxBySection = new Map<string, number>();
    for (const c of countData as SectionCountRow[]) {
        maxBySection.set(c.section_id, c.q_count);
    }

    const rawBySection = new Map<string, number>();
    for (const row of reviewRows) {
        if (!row.section_id || !row.is_correct) continue;
        rawBySection.set(row.section_id, (rawBySection.get(row.section_id) ?? 0) + 1);
    }

    const sections: SectionOutcome[] = (
        sectionData as { id: string; section: string }[]
    ).map((s) => {
        const raw = rawBySection.get(s.id) ?? 0;
        const max = maxBySection.get(s.id) ?? 0;
        return {
            sectionId: s.id,
            section: s.section as MockSectionKind,
            raw,
            max,
            band: max > 0 ? getTdnBand(Math.round((raw / max) * 20)) : 'unter_tdn3',
        };
    });

    const { data: examRow, error: examError } = await pub
        .from('mock_exams')
        .select('code')
        .eq('id', session.exam_id)
        .maybeSingle();
    if (examError || !examRow) {
        console.error(`Failed to load exam code for session '${sessionId}':`, examError);
        return null;
    }

    return {
        sessionId: session.id,
        examCode: (examRow as { code: string }).code,
        ...(session.completed_at ? { completedAt: session.completed_at } : {}),
        sections,
        review,
    };
}

export async function getSessionHistory(): Promise<MockHistoryEntry[]> {
    const userId = await studentUserId();
    if (!userId) return [];

    const supabase = await createClient();
    const { data: sessionData, error: sessionError } = await supabase
        .from('mock_sessions')
        .select('id, exam_id, completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(20);
    if (sessionError || !sessionData) {
        console.error('Failed to load mock session history:', sessionError);
        return [];
    }
    const sessions = sessionData as { id: string; exam_id: string; completed_at: string | null }[];
    if (sessions.length === 0) return [];

    const sessionIds = sessions.map((s) => s.id);
    const { data: attemptData, error: attemptError } = await supabase
        .from('attempts')
        .select('session_id, is_correct')
        .in('session_id', sessionIds);
    if (attemptError || !attemptData) {
        console.error('Failed to load attempts for history:', attemptError);
        return [];
    }

    const correctBySession = new Map<string, number>();
    for (const a of attemptData as { session_id: string | null; is_correct: boolean }[]) {
        if (!a.session_id || !a.is_correct) continue;
        correctBySession.set(a.session_id, (correctBySession.get(a.session_id) ?? 0) + 1);
    }

    const totalByExam = new Map<string, number>();
    for (const examId of new Set(sessions.map((s) => s.exam_id))) {
        const { data: counts, error } = await supabase.rpc('get_section_question_counts', {
            p_exam_id: examId,
        });
        if (error || !counts) {
            console.error(`Failed to load question counts for exam '${examId}':`, error);
            continue;
        }
        totalByExam.set(
            examId,
            (counts as SectionCountRow[]).reduce((sum, c) => sum + c.q_count, 0)
        );
    }

    const entries: MockHistoryEntry[] = [];
    for (const session of sessions) {
        const total = totalByExam.get(session.exam_id);
        if (total === undefined || total <= 0) continue;
        if (!session.completed_at) continue;
        entries.push({
            sessionId: session.id,
            completedAt: session.completed_at,
            percent: Math.round(((correctBySession.get(session.id) ?? 0) / total) * 100),
        });
    }
    return entries;
}
