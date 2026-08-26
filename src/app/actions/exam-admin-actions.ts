
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/supabase/auth-guard';
import type { Language, LocalizedString } from '@/lib/types';

/**
 * Admin-side mock-exam authoring actions (exams → sections → questions).
 *
 * Every action is gated by `isAdminRequest()` (defense-in-depth with the
 * admin RLS policies on `mock_exams` / `mock_sections` / `questions`) and
 * writes through the request-bound Supabase client so RLS is exercised for
 * real. Payload/answer_key shapes are contractual with the student-side
 * grader and IDENTICAL to the LMS question shapes:
 *   mc    payload {"options":[{"id":"a","text":{en,de,fa}}]} answer {"correct":"a"}
 *   jnl   payload {}                                         answer {"correct":"ja"|"nein"|"nichts"}
 *   match payload {"left":[...],"right":[...]}               answer {"mapping":{"l1":"r1"}}
 */

export interface ActionResult {
  success: boolean;
  message: string;
  /** Populated on successful upsert so the client can link children immediately. */
  id?: string;
}

const LANGS: Language[] = ['en', 'de', 'fa'];
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

const EXAM_CODES = ['testdaf_paper', 'testdaf_digital'] as const;
const EXAM_SECTIONS = ['lesen', 'hoeren'] as const;
const JNL_VALUES = ['ja', 'nein', 'nichts'] as const;

const idSchema = z.string().uuid();
const sortOrderSchema = z.coerce.number().int().min(0).default(0);

// --- FormData helpers ---

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function optionalInt(formData: FormData, key: string): number | undefined {
  const raw = str(formData, key).trim();
  if (raw === '') return undefined;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : NaN; // NaN fails the zod int check
}

/**
 * Normalizes a trilingual triple from formData keys `${prefix}En/${prefix}De/${prefix}Fa`.
 * Persian is required and acts as the fallback for blank English/German values
 * (house normalization rule), so stored jsonb never contains empty en/de holes.
 */
function readLocalized(formData: FormData, prefix: string): LocalizedString | null {
  const fa = str(formData, `${prefix}Fa`).trim();
  if (!fa) return null;
  const en = str(formData, `${prefix}En`).trim() || fa;
  const de = str(formData, `${prefix}De`).trim() || fa;
  return { en, de, fa };
}

const localizedSchema = z.object({
  en: z.string().min(1),
  de: z.string().min(1),
  fa: z.string().min(1),
});

/** Revalidate the exam list plus the admin tree page of the touched exam. */
function revalidateExamTree(examId?: string): void {
  revalidatePath('/admin/exams');
  if (examId && idSchema.safeParse(examId).success) {
    revalidatePath(`/admin/exams/${examId}`);
  }
}

// --- Exams ---

export async function upsertMockExam(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const rawId = str(formData, 'id').trim();
  const parsed = z
    .object({
      id: idSchema.optional(),
      code: z.enum(EXAM_CODES),
      title: localizedSchema,
      isActive: z.boolean(),
    })
    .safeParse({
      ...(rawId ? { id: rawId } : {}),
      code: str(formData, 'code'),
      title: readLocalized(formData, 'title'),
      isActive: str(formData, 'isActive') === 'on',
    });

  if (!parsed.success) {
    console.error('upsertMockExam validation failed:', parsed.error.flatten());
    return { success: false, message: 'invalid_input' };
  }
  const { code, title, isActive } = parsed.data;

  try {
    const supabase = await createClient();
    const row = {
      code,
      title,
      is_active: isActive,
    };
    let savedId = parsed.data.id;
    if (savedId !== undefined) {
      const { error } = await supabase.from('mock_exams').update(row).eq('id', savedId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('mock_exams').insert(row).select('id').single();
      if (error) throw error;
      savedId = data?.id;
    }

    revalidateExamTree(savedId);
    return { success: true, message: 'saved', ...(savedId ? { id: savedId } : {}) };
  } catch (error) {
    console.error('Failed to save mock exam:', error);
    return { success: false, message: 'invalid_input' };
  }
}

export async function deleteMockExam(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const parsed = z.object({ id: idSchema }).safeParse({ id: str(formData, 'id').trim() });
  if (!parsed.success) {
    console.error('deleteMockExam validation failed:', parsed.error.flatten());
    return { success: false, message: 'delete_failed' };
  }

  try {
    const supabase = await createClient();
    // Sections/questions cascade via DB FKs.
    const { error } = await supabase.from('mock_exams').delete().eq('id', parsed.data.id);
    if (error) throw error;

    revalidatePath('/admin/exams');
    return { success: true, message: 'deleted' };
  } catch (error) {
    console.error('Failed to delete mock exam:', error);
    return { success: false, message: 'delete_failed' };
  }
}

// --- Sections ---

export async function upsertMockSection(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const rawId = str(formData, 'id').trim();
  const durationRaw = optionalInt(formData, 'durationMin');
  const parsed = z
    .object({
      id: idSchema.optional(),
      examId: idSchema,
      section: z.enum(EXAM_SECTIONS),
      durationMin: z.number().int().min(1).max(240),
      sortOrder: sortOrderSchema,
    })
    .safeParse({
      ...(rawId ? { id: rawId } : {}),
      examId: str(formData, 'examId').trim(),
      section: str(formData, 'section'),
      ...(durationRaw !== undefined ? { durationMin: durationRaw } : {}),
      sortOrder: str(formData, 'sortOrder').trim() === '' ? 0 : Number(str(formData, 'sortOrder')),
    });

  if (!parsed.success) {
    console.error('upsertMockSection validation failed:', parsed.error.flatten());
    return { success: false, message: 'invalid_input' };
  }
  const { examId, section, durationMin, sortOrder } = parsed.data;

  try {
    const supabase = await createClient();
    const row = {
      exam_id: examId,
      section,
      duration_min: durationMin,
      sort_order: sortOrder,
    };
    let savedId = parsed.data.id;
    if (savedId !== undefined) {
      const { error } = await supabase.from('mock_sections').update(row).eq('id', savedId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('mock_sections').insert(row).select('id').single();
      if (error) throw error;
      savedId = data?.id;
    }

    revalidateExamTree(examId);
    return { success: true, message: 'saved', ...(savedId ? { id: savedId } : {}) };
  } catch (error) {
    console.error('Failed to save mock section:', error);
    return { success: false, message: 'invalid_input' };
  }
}

export async function deleteMockSection(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const parsed = z.object({ id: idSchema }).safeParse({ id: str(formData, 'id').trim() });
  if (!parsed.success) {
    console.error('deleteMockSection validation failed:', parsed.error.flatten());
    return { success: false, message: 'delete_failed' };
  }

  try {
    const supabase = await createClient();
    // Questions cascade via DB FKs.
    const { error } = await supabase.from('mock_sections').delete().eq('id', parsed.data.id);
    if (error) throw error;

    // The client passes the owning exam so its tree page can be refreshed.
    revalidateExamTree(str(formData, 'examId').trim());
    return { success: true, message: 'deleted' };
  } catch (error) {
    console.error('Failed to delete mock section:', error);
    return { success: false, message: 'delete_failed' };
  }
}

// --- Questions ---

interface OptionPayload {
  options: { id: string; text: LocalizedString }[];
}
interface MatchPayload {
  left: { id: string; text: LocalizedString }[];
  right: { id: string; text: LocalizedString }[];
}
type QuestionPayload = OptionPayload | MatchPayload | Record<string, never>;
interface AnswerKey {
  correct?: string;
  mapping?: Record<string, string>;
}

function isFilled(text: LocalizedString): boolean {
  return LANGS.some((lang) => text[lang].trim() !== '');
}

export async function upsertExamQuestion(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const rawId = str(formData, 'id').trim();
  const type = str(formData, 'type');
  const audioRaw = str(formData, 'audioPath').trim();
  const playsRaw = optionalInt(formData, 'playsAllowed');
  const baseFields = {
    ...(rawId ? { id: rawId } : {}),
    sectionId: str(formData, 'sectionId').trim(),
    prompt: readLocalized(formData, 'prompt'),
    points: str(formData, 'points').trim() === '' ? 1 : Number(str(formData, 'points')),
    sortOrder: str(formData, 'sortOrder').trim() === '' ? 0 : Number(str(formData, 'sortOrder')),
  };
  const metaParsed = z
    .object({
      audioPath: z.string().max(300).optional(),
      playsAllowed: z.number().int().min(0).max(2).default(0),
    })
    .safeParse({
      ...(audioRaw ? { audioPath: audioRaw } : {}),
      ...(playsRaw !== undefined ? { playsAllowed: playsRaw } : {}),
    });
  if (!metaParsed.success) {
    console.error('upsertExamQuestion(meta) validation failed:', metaParsed.error.flatten());
    return { success: false, message: 'invalid_input' };
  }

  let payload: QuestionPayload;
  let answerKey: AnswerKey;

  if (type === 'mc') {
    const optionCount = Math.min(Math.max(Number(str(formData, 'optionCount')) || 0, 0), LETTERS.length);
    const correctOption = str(formData, 'correctOption').trim();
    const options: { id: string; text: LocalizedString }[] = [];
    for (let i = 0; i < optionCount; i++) {
      const letter = LETTERS[i];
      if (!letter) break;
      const text = readLocalized(formData, `optionText${letter.toUpperCase()}`);
      if (text && isFilled(text)) options.push({ id: letter, text });
    }
    const mcParsed = z
      .object({
        id: idSchema.optional(),
        sectionId: idSchema,
        prompt: localizedSchema,
        points: z.number().int().min(1).max(100),
        sortOrder: sortOrderSchema,
      })
      .safeParse(baseFields);
    if (!mcParsed.success || options.length === 0 || !options.some((o) => o.id === correctOption)) {
      console.error(
        'upsertExamQuestion(mc) validation failed:',
        mcParsed.success ? 'options/correct mismatch' : mcParsed.error.flatten()
      );
      return { success: false, message: 'invalid_input' };
    }
    payload = { options };
    answerKey = { correct: correctOption };
  } else if (type === 'jnl') {
    const jnlParsed = z
      .object({
        id: idSchema.optional(),
        sectionId: idSchema,
        prompt: localizedSchema,
        points: z.number().int().min(1).max(100),
        sortOrder: sortOrderSchema,
        correctJnl: z.enum(JNL_VALUES),
      })
      .safeParse({ ...baseFields, correctJnl: str(formData, 'correctJnl') });
    if (!jnlParsed.success) {
      console.error('upsertExamQuestion(jnl) validation failed:', jnlParsed.error.flatten());
      return { success: false, message: 'invalid_input' };
    }
    payload = {};
    answerKey = { correct: jnlParsed.data.correctJnl };
  } else if (type === 'match') {
    const pairCount = Math.min(Math.max(Number(str(formData, 'pairCount')) || 0, 0), 6);
    const left: { id: string; text: LocalizedString }[] = [];
    const right: { id: string; text: LocalizedString }[] = [];
    for (let i = 1; i <= pairCount; i++) {
      const leftText = readLocalized(formData, `leftText${i}`);
      const rightLabel = readLocalized(formData, `rightLabel${i}`);
      if (!leftText || !rightLabel) {
        console.error(`upsertExamQuestion(match): pair ${i} incomplete`);
        return { success: false, message: 'invalid_input' };
      }
      left.push({ id: `l${i}`, text: leftText });
      right.push({ id: `r${i}`, text: rightLabel });
    }
    const matchParsed = z
      .object({
        id: idSchema.optional(),
        sectionId: idSchema,
        prompt: localizedSchema,
        points: z.number().int().min(1).max(100),
        sortOrder: sortOrderSchema,
      })
      .safeParse(baseFields);
    if (!matchParsed.success || pairCount === 0) {
      console.error(
        'upsertExamQuestion(match) validation failed:',
        matchParsed.success ? 'empty pairs' : matchParsed.error.flatten()
      );
      return { success: false, message: 'invalid_input' };
    }
    payload = { left, right };
    const mapping: Record<string, string> = {};
    for (let i = 1; i <= pairCount; i++) mapping[`l${i}`] = `r${i}`;
    answerKey = { mapping };
  } else {
    console.error(`upsertExamQuestion: unknown question type "${type}"`);
    return { success: false, message: 'invalid_input' };
  }

  const shared = baseFields as {
    id?: string;
    sectionId: string;
    prompt: LocalizedString;
    points: number;
    sortOrder: number;
  };

  try {
    const supabase = await createClient();
    const row = {
      section_id: shared.sectionId,
      type,
      prompt: shared.prompt,
      payload,
      answer_key: answerKey,
      points: shared.points,
      sort_order: shared.sortOrder,
      // Always written: an emptied path must clear a previously stored value
      // (the editor's Clear button relies on this when updating).
      audio_path: metaParsed.data.audioPath ?? null,
      ...(metaParsed.data.playsAllowed !== undefined
        ? { plays_allowed: metaParsed.data.playsAllowed }
        : {}),
    };
    let savedId = shared.id;
    if (savedId !== undefined) {
      const { error } = await supabase.from('questions').update(row).eq('id', savedId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('questions').insert(row).select('id').single();
      if (error) throw error;
      savedId = data?.id;
    }

    // The client passes the owning exam so its tree page can be refreshed.
    revalidateExamTree(str(formData, 'examId').trim());
    return { success: true, message: 'saved', ...(savedId ? { id: savedId } : {}) };
  } catch (error) {
    console.error('Failed to save exam question:', error);
    return { success: false, message: 'invalid_input' };
  }
}

export async function deleteExamQuestion(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const parsed = z.object({ id: idSchema }).safeParse({ id: str(formData, 'id').trim() });
  if (!parsed.success) {
    console.error('deleteExamQuestion validation failed:', parsed.error.flatten());
    return { success: false, message: 'delete_failed' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('questions').delete().eq('id', parsed.data.id);
    if (error) throw error;

    revalidateExamTree(str(formData, 'examId').trim());
    return { success: true, message: 'deleted' };
  } catch (error) {
    console.error('Failed to delete exam question:', error);
    return { success: false, message: 'delete_failed' };
  }
}
