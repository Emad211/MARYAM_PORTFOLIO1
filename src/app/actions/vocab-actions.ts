'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createPublicClient } from '@/lib/supabase/server';
import { studentUserId } from '@/lib/supabase/auth-guard';
import type {
    LocalizedString,
    VocabDeck,
    VocabCard,
    DueCard,
    VocabDashboardData,
    VocabDomain,
    CardWordType,
    ReviewGrade,
} from '@/lib/types';
import type { ActionResult } from './lms-actions';

// ---------------------------------------------------------------------------
// Raw DB row shapes (JSONB columns arrive untyped; mappers live inline here
// because vocab rows are not part of lib/supabase/mappers.ts).
//
// NOTE: `ease_factor` is a Postgres `numeric(4,3)` — supabase-js returns it as
// a STRING. Always coerce with Number() before doing math.
// ---------------------------------------------------------------------------

interface DeckRow {
    id: string;
    title: unknown;
    description: unknown;
    domain: string;
    class_slug: string | null;
    is_active: boolean;
    sort_order: number;
}

interface CardRow {
    id: string;
    deck_id: string;
    front_de: string;
    word_type: string;
    hint: unknown;
    example_de: string | null;
    example_en_fa: string | null;
    sort_order: number;
}

interface ReviewRow {
    card_id: string;
    due_at: string;
    ease_factor: number | string;
    interval_days: number;
    repetitions: number;
    lapses: number;
}

function mapDeckRow(row: DeckRow): VocabDeck {
    return {
        id: row.id,
        title: row.title as LocalizedString,
        ...(row.description ? { description: row.description as LocalizedString } : {}),
        domain: row.domain as VocabDomain,
        ...(row.class_slug ? { classSlug: row.class_slug } : {}),
        isActive: row.is_active,
        sortOrder: row.sort_order,
    };
}

function mapCardRow(row: CardRow): VocabCard {
    return {
        id: row.id,
        deckId: row.deck_id,
        frontDe: row.front_de,
        wordType: row.word_type as CardWordType,
        ...(row.hint ? { hint: row.hint as LocalizedString } : {}),
        ...(row.example_de ? { exampleDe: row.example_de } : {}),
        // Column name is example_en_fa (single text column); surfaced as the
        // German-learner-facing translation field.
        ...(row.example_en_fa ? { exampleEn: row.example_en_fa } : {}),
        sortOrder: row.sort_order,
    };
}

const DAY_MS = 86_400_000;

/** UTC calendar date (YYYY-MM-DD) of a timestamp — v1 convention for
 *  study_log's `date` PK component (server-side UTC, not user-local). */
function utcDateKey(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function round3(n: number): number {
    return Math.round(n * 1000) / 1000;
}

// ---------------------------------------------------------------------------
// Dashboard — public content via cookie-less client, per-user review state via
// request-bound client (RLS scopes vocab_reviews/study_log to their owner).
// ---------------------------------------------------------------------------

export async function getVocabDashboard(): Promise<VocabDashboardData> {
    const userId = await studentUserId();
    if (!userId) {
        return { decks: [], dueTotal: 0, streakDays: 0, studiedToday: false, reviewsToday: 0 };
    }

    const pub = createPublicClient();

    const { data: deckData, error: deckError } = await pub
        .from('vocab_decks')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
    if (deckError || !deckData) {
        console.error('Failed to load vocab decks:', deckError);
        return { decks: [], dueTotal: 0, streakDays: 0, studiedToday: false, reviewsToday: 0 };
    }
    const decks = (deckData as DeckRow[]).map(mapDeckRow);

    const { data: cardData, error: cardError } = await pub.from('vocab_cards').select('id, deck_id');
    if (cardError || !cardData) {
        console.error('Failed to load vocab cards:', cardError);
        return { decks: [], dueTotal: 0, streakDays: 0, studiedToday: false, reviewsToday: 0 };
    }

    const supabase = await createClient();
    const { data: reviewData, error: reviewError } = await supabase
        .from('vocab_reviews')
        .select('card_id, due_at')
        .eq('user_id', userId);
    if (reviewError || !reviewData) {
        console.error('Failed to load vocab reviews:', reviewError);
        return { decks: [], dueTotal: 0, streakDays: 0, studiedToday: false, reviewsToday: 0 };
    }

    // A card counts as due when it has NEVER been reviewed (new cards pull
    // beginners in immediately) OR its scheduled due_at has passed.
    const nowIso = new Date().toISOString();
    const dueByCard = new Map<string, string>();
    for (const row of reviewData as { card_id: string; due_at: string }[]) {
        dueByCard.set(row.card_id, row.due_at);
    }

    const activeDeckIds = new Set(decks.map((d) => d.id));
    const totalByDeck = new Map<string, number>();
    const dueByDeck = new Map<string, number>();
    let dueTotal = 0;
    for (const c of cardData as { id: string; deck_id: string }[]) {
        if (!activeDeckIds.has(c.deck_id)) continue;
        totalByDeck.set(c.deck_id, (totalByDeck.get(c.deck_id) ?? 0) + 1);
        const dueAt = dueByCard.get(c.id);
        const isDue = dueAt === undefined || dueAt <= nowIso;
        if (isDue) {
            dueByDeck.set(c.deck_id, (dueByDeck.get(c.deck_id) ?? 0) + 1);
            dueTotal += 1;
        }
    }

    // Streak: consecutive study_log dates ending today (or yesterday — today
    // may simply not have happened yet without breaking an alive streak).
    const todayKey = utcDateKey(new Date());
    const ninetyAgoKey = utcDateKey(new Date(Date.now() - 90 * DAY_MS));
    const { data: logRows, error: logError } = await supabase
        .from('study_log')
        .select('study_date, reviews_done')
        .gte('study_date', ninetyAgoKey)
        .order('study_date', { ascending: false });
    if (logError || !logRows) {
        console.error('Failed to load study log:', logError);
        return { decks: [], dueTotal: 0, streakDays: 0, studiedToday: false, reviewsToday: 0 };
    }
    const logList = logRows as { study_date: string; reviews_done: number }[];
    const studiedDates = new Set(logList.map((r) => r.study_date));

    let cursor = new Date(`${todayKey}T00:00:00Z`);
    if (!studiedDates.has(utcDateKey(cursor))) {
        cursor = new Date(cursor.getTime() - DAY_MS);
    }
    let streakDays = 0;
    while (studiedDates.has(utcDateKey(cursor))) {
        streakDays += 1;
        cursor = new Date(cursor.getTime() - DAY_MS);
    }

    const todayRow = logList.find((r) => r.study_date === todayKey);
    const reviewsToday = todayRow ? Number(todayRow.reviews_done) : 0;

    return {
        decks: decks.map((deck) => ({
            deck,
            totalCards: totalByDeck.get(deck.id) ?? 0,
            dueCount: dueByDeck.get(deck.id) ?? 0,
        })),
        dueTotal,
        streakDays,
        studiedToday: reviewsToday > 0,
        reviewsToday,
    };
}

// ---------------------------------------------------------------------------
// Review session queue — two-step LEFT JOIN in JS (supabase-js cannot filter a
// child embed by parent user): all cards of active decks + own review rows.
// New (never-reviewed) cards come first so beginners start immediately, then
// overdue cards oldest-due first.
// ---------------------------------------------------------------------------

export async function startReviewSession(limit = 20): Promise<DueCard[]> {
    const userId = await studentUserId();
    if (!userId) return [];

    const pub = createPublicClient();
    const { data: deckData, error: deckError } = await pub
        .from('vocab_decks')
        .select('id')
        .eq('is_active', true);
    if (deckError || !deckData) {
        console.error('Failed to load active vocab decks:', deckError);
        return [];
    }
    const deckIds = (deckData as { id: string }[]).map((d) => d.id);
    if (deckIds.length === 0) return [];

    const { data: cardData, error: cardError } = await pub
        .from('vocab_cards')
        .select('*')
        .in('deck_id', deckIds)
        .order('sort_order');
    if (cardError || !cardData) {
        console.error('Failed to load vocab cards for review:', cardError);
        return [];
    }
    const cards = (cardData as CardRow[]).map(mapCardRow);

    const supabase = await createClient();
    const { data: reviewData, error: reviewError } = await supabase
        .from('vocab_reviews')
        .select('card_id, due_at')
        .eq('user_id', userId);
    if (reviewError || !reviewData) {
        console.error('Failed to load vocab reviews for queue:', reviewError);
        return [];
    }
    const dueByCard = new Map<string, string>();
    for (const row of reviewData as { card_id: string; due_at: string }[]) {
        dueByCard.set(row.card_id, row.due_at);
    }

    const nowIso = new Date().toISOString();
    const newCards: DueCard[] = [];
    const dueCards: DueCard[] = [];
    for (const card of cards) {
        const dueAt = dueByCard.get(card.id);
        if (dueAt === undefined) {
            newCards.push({ ...card, isNew: true });
        } else if (dueAt <= nowIso) {
            dueCards.push({ ...card, isNew: false, ...(dueAt ? { dueAt } : {}) });
        }
    }
    dueCards.sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''));

    return [...newCards, ...dueCards].slice(0, limit);
}

// ---------------------------------------------------------------------------
// Grading — SM-2 variant per pinned spec. ease_factor arrives as a STRING
// (Postgres numeric) and must be coerced before arithmetic.
// ---------------------------------------------------------------------------

const QUALITY = { again: 2, hard: 3, good: 4, easy: 5 } as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GRADES: readonly ReviewGrade[] = ['again', 'hard', 'good', 'easy'];

export async function gradeCard(cardId: string, grade: ReviewGrade): Promise<ActionResult> {
    const userId = await studentUserId();
    if (!userId) return { success: false, message: 'unauthorized' };

    if (!UUID_RE.test(cardId) || !GRADES.includes(grade)) {
        return { success: false, message: 'invalid_input' };
    }

    try {
        const pub = createPublicClient();
        const { data: cardExists, error: cardError } = await pub
            .from('vocab_cards')
            .select('id')
            .eq('id', cardId)
            .maybeSingle();
        if (cardError) throw cardError;
        if (!cardExists) return { success: false, message: 'not_found' };

        const supabase = await createClient();
        const { data: rowData, error: rowError } = await supabase
            .from('vocab_reviews')
            .select('ease_factor, interval_days, repetitions, lapses')
            .eq('user_id', userId)
            .eq('card_id', cardId)
            .maybeSingle();
        if (rowError) throw rowError;
        const row = rowData as ReviewRow | null;

        const prevEase = row ? Number(row.ease_factor) : 2.5;
        const prevInterval = row?.interval_days ?? 0;
        const prevReps = row?.repetitions ?? 0;
        const prevLapses = row?.lapses ?? 0;

        const nowMs = Date.now();
        let easeFactor: number;
        let intervalDays: number;
        let repetitions: number;
        let lapses: number;
        let dueAt: string;

        if (grade === 'again') {
            repetitions = 0;
            lapses = prevLapses + 1;
            intervalDays = 0;
            easeFactor = Math.max(1.3, round3(prevEase - 0.2));
            dueAt = new Date(nowMs + 10 * 60_000).toISOString(); // relearn in 10 min
        } else {
            const q = QUALITY[grade];
            easeFactor = Math.max(1.3, round3(prevEase + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))));
            repetitions = prevReps + 1;
            lapses = prevLapses;
            let interval: number;
            if (repetitions === 1) {
                interval = 1;
            } else if (repetitions === 2) {
                interval = 6;
            } else {
                interval = Math.round(prevInterval * easeFactor);
            }
            if (grade === 'hard') interval = Math.max(1, Math.round(interval * 0.6));
            if (grade === 'easy') interval = Math.round(interval * 1.25);
            intervalDays = interval;
            dueAt = new Date(nowMs + interval * DAY_MS).toISOString();
        }

        const { error: upsertError } = await supabase.from('vocab_reviews').upsert(
            {
                user_id: userId,
                card_id: cardId,
                ease_factor: easeFactor,
                interval_days: intervalDays,
                repetitions,
                lapses,
                due_at: dueAt,
                last_grade: QUALITY[grade],
                last_reviewed_at: new Date(nowMs).toISOString(),
            },
            { onConflict: 'user_id,card_id' }
        );
        if (upsertError) throw upsertError;

        // Daily counter — supabase-js has no atomic increment, so read-today-
        // then-upsert(value+1). A concurrent same-day grade can lose one count
        // (race acceptable v1); the review itself is already committed above,
        // so a counter failure must NOT fail the action.
        const todayKey = utcDateKey(new Date());
        try {
            const { data: logRow } = await supabase
                .from('study_log')
                .select('reviews_done')
                .eq('user_id', userId)
                .eq('study_date', todayKey)
                .maybeSingle();
            const prevDone = logRow ? Number((logRow as { reviews_done: number }).reviews_done) : 0;
            const { error: logUpsertError } = await supabase
                .from('study_log')
                .upsert(
                    { user_id: userId, study_date: todayKey, reviews_done: prevDone + 1 },
                    { onConflict: 'user_id,study_date' }
                );
            if (logUpsertError) throw logUpsertError;
        } catch (logError) {
            console.error('Failed to update study log (review still recorded):', logError);
        }

        revalidatePath('/dashboard');
        return { success: true, message: 'graded' };
    } catch (error) {
        console.error('Failed to grade vocab card:', error);
        return { success: false, message: 'grade_failed' };
    }
}
