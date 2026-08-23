
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/supabase/auth-guard';
import type { Language, LocalizedString } from '@/lib/types';

/**
 * Admin-side LMS authoring actions (modules → lessons → questions).
 *
 * Every action is gated by `isAdminRequest()` (defense-in-depth with the
 * admin RLS policies on `modules` / `lessons` / `questions`) and writes
 * through the request-bound Supabase client so RLS is exercised for real.
 * Payload/answer_key shapes are contractual with the student-side grader:
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

const SKILLS = ['lesen', 'hoeren', 'schreiben', 'sprechen', 'allgemein'] as const;
const JNL_VALUES = ['ja', 'nein', 'nichts'] as const;

const classSlugSchema = z.string().min(1).max(120).regex(/^[a-z0-9-]+$/);
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

/** Revalidate the admin tree page for the class a mutation belongs to. */
function revalidateClassTree(classSlug: string): void {
  revalidatePath(`/admin/lms/${classSlug}`);
}

// --- Modules ---

export async function upsertLmsModule(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const rawId = str(formData, 'id').trim();
  const parsed = z
    .object({
      id: idSchema.optional(),
      classSlug: classSlugSchema,
      title: localizedSchema,
      sortOrder: sortOrderSchema,
    })
    .safeParse({
      ...(rawId ? { id: rawId } : {}),
      classSlug: str(formData, 'classSlug').trim(),
      title: readLocalized(formData, 'title'),
      sortOrder: str(formData, 'sortOrder').trim() === '' ? 0 : Number(str(formData, 'sortOrder')),
    });

  if (!parsed.success) {
    console.error('upsertLmsModule validation failed:', parsed.error.flatten());
    return { success: false, message: 'invalid_input' };
  }
  const { classSlug, title, sortOrder } = parsed.data;

  try {
    const supabase = await createClient();
    const row = {
      class_slug: classSlug,
      title,
      sort_order: sortOrder,
    };
    let savedId = parsed.data.id;
    if (savedId !== undefined) {
      const { error } = await supabase.from('modules').update(row).eq('id', savedId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('modules').insert(row).select('id').single();
      if (error) throw error;
      savedId = data?.id;
    }

    revalidateClassTree(classSlug);
    return { success: true, message: 'saved', ...(savedId ? { id: savedId } : {}) };
  } catch (error) {
    console.error('Failed to save LMS module:', error);
    return { success: false, message: 'invalid_input' };
  }
}

export async function deleteLmsModule(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const parsed = z.object({ id: idSchema }).safeParse({ id: str(formData, 'id').trim() });
  if (!parsed.success) {
    console.error('deleteLmsModule validation failed:', parsed.error.flatten());
    return { success: false, message: 'delete_failed' };
  }

  try {
    const supabase = await createClient();
    // Lessons/questions cascade via DB FKs.
    const { error } = await supabase.from('modules').delete().eq('id', parsed.data.id);
    if (error) throw error;

    const classSlug = str(formData, 'classSlug').trim();
    if (classSlugSchema.safeParse(classSlug).success) revalidateClassTree(classSlug);
    return { success: true, message: 'deleted' };
  } catch (error) {
    console.error('Failed to delete LMS module:', error);
    return { success: false, message: 'delete_failed' };
  }
}

// --- Lessons ---

export async function upsertLmsLesson(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const rawId = str(formData, 'id').trim();
  const videoUrlRaw = str(formData, 'videoUrl').trim();
  const durationRaw = optionalInt(formData, 'durationMin');
  const parsed = z
    .object({
      id: idSchema.optional(),
      moduleId: idSchema,
      title: localizedSchema,
      body: localizedSchema,
      videoUrl: z.string().url().max(2048).optional(),
      skill: z.enum(SKILLS),
      durationMin: z.number().int().min(0).optional(),
      isFreePreview: z.boolean(),
      sortOrder: sortOrderSchema,
      classSlug: classSlugSchema,
    })
    .safeParse({
      ...(rawId ? { id: rawId } : {}),
      moduleId: str(formData, 'moduleId').trim(),
      title: readLocalized(formData, 'title'),
      body: readLocalized(formData, 'body'),
      ...(videoUrlRaw ? { videoUrl: videoUrlRaw } : {}),
      skill: str(formData, 'skill'),
      ...(durationRaw !== undefined ? { durationMin: durationRaw } : {}),
      isFreePreview: str(formData, 'isFreePreview') === 'on',
      sortOrder: str(formData, 'sortOrder').trim() === '' ? 0 : Number(str(formData, 'sortOrder')),
      classSlug: str(formData, 'classSlug').trim(),
    });

  if (!parsed.success) {
    console.error('upsertLmsLesson validation failed:', parsed.error.flatten());
    return { success: false, message: 'invalid_input' };
  }
  const { moduleId, title, body, videoUrl, skill, durationMin, isFreePreview, sortOrder, classSlug } =
    parsed.data;

  try {
    const supabase = await createClient();
    const row = {
      module_id: moduleId,
      title,
      body,
      skill,
      is_free_preview: isFreePreview,
      sort_order: sortOrder,
      ...(videoUrl !== undefined ? { video_url: videoUrl } : {}),
      ...(durationMin !== undefined ? { duration_min: durationMin } : {}),
    };
    let savedId = parsed.data.id;
    if (savedId !== undefined) {
      const { error } = await supabase.from('lessons').update(row).eq('id', savedId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('lessons').insert(row).select('id').single();
      if (error) throw error;
      savedId = data?.id;
    }

    revalidateClassTree(classSlug);
    return { success: true, message: 'saved', ...(savedId ? { id: savedId } : {}) };
  } catch (error) {
    console.error('Failed to save LMS lesson:', error);
    return { success: false, message: 'invalid_input' };
  }
}

export async function deleteLmsLesson(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const parsed = z.object({ id: idSchema }).safeParse({ id: str(formData, 'id').trim() });
  if (!parsed.success) {
    console.error('deleteLmsLesson validation failed:', parsed.error.flatten());
    return { success: false, message: 'delete_failed' };
  }

  try {
    const supabase = await createClient();
    // Questions cascade via DB FKs.
    const { error } = await supabase.from('lessons').delete().eq('id', parsed.data.id);
    if (error) throw error;

    const classSlug = str(formData, 'classSlug').trim();
    if (classSlugSchema.safeParse(classSlug).success) revalidateClassTree(classSlug);
    return { success: true, message: 'deleted' };
  } catch (error) {
    console.error('Failed to delete LMS lesson:', error);
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

export async function upsertLmsQuestion(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const rawId = str(formData, 'id').trim();
  const type = str(formData, 'type');
  const baseFields = {
    ...(rawId ? { id: rawId } : {}),
    lessonId: str(formData, 'lessonId').trim(),
    prompt: readLocalized(formData, 'prompt'),
    points: str(formData, 'points').trim() === '' ? 1 : Number(str(formData, 'points')),
    sortOrder: str(formData, 'sortOrder').trim() === '' ? 0 : Number(str(formData, 'sortOrder')),
    classSlug: str(formData, 'classSlug').trim(),
  };

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
        lessonId: idSchema,
        prompt: localizedSchema,
        points: z.number().int().min(0).max(100),
        sortOrder: sortOrderSchema,
        classSlug: classSlugSchema,
      })
      .safeParse(baseFields);
    if (!mcParsed.success || options.length === 0 || !options.some((o) => o.id === correctOption)) {
      console.error(
        'upsertLmsQuestion(mc) validation failed:',
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
        lessonId: idSchema,
        prompt: localizedSchema,
        points: z.number().int().min(0).max(100),
        sortOrder: sortOrderSchema,
        classSlug: classSlugSchema,
        correctJnl: z.enum(JNL_VALUES),
      })
      .safeParse({ ...baseFields, correctJnl: str(formData, 'correctJnl') });
    if (!jnlParsed.success) {
      console.error('upsertLmsQuestion(jnl) validation failed:', jnlParsed.error.flatten());
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
        console.error(`upsertLmsQuestion(match): pair ${i} incomplete`);
        return { success: false, message: 'invalid_input' };
      }
      left.push({ id: `l${i}`, text: leftText });
      right.push({ id: `r${i}`, text: rightLabel });
    }
    const matchParsed = z
      .object({
        id: idSchema.optional(),
        lessonId: idSchema,
        prompt: localizedSchema,
        points: z.number().int().min(0).max(100),
        sortOrder: sortOrderSchema,
        classSlug: classSlugSchema,
      })
      .safeParse(baseFields);
    if (!matchParsed.success || pairCount === 0) {
      console.error(
        'upsertLmsQuestion(match) validation failed:',
        matchParsed.success ? 'empty pairs' : matchParsed.error.flatten()
      );
      return { success: false, message: 'invalid_input' };
    }
    payload = { left, right };
    const mapping: Record<string, string> = {};
    for (let i = 1; i <= pairCount; i++) mapping[`l${i}`] = `r${i}`;
    answerKey = { mapping };
  } else {
    console.error(`upsertLmsQuestion: unknown question type "${type}"`);
    return { success: false, message: 'invalid_input' };
  }

  const shared = baseFields as {
    id?: string;
    lessonId: string;
    prompt: LocalizedString;
    points: number;
    sortOrder: number;
    classSlug: string;
  };

  try {
    const supabase = await createClient();
    const row = {
      lesson_id: shared.lessonId,
      type,
      prompt: shared.prompt,
      payload,
      answer_key: answerKey,
      points: shared.points,
      sort_order: shared.sortOrder,
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

    revalidateClassTree(shared.classSlug);
    return { success: true, message: 'saved', ...(savedId ? { id: savedId } : {}) };
  } catch (error) {
    console.error('Failed to save LMS question:', error);
    return { success: false, message: 'invalid_input' };
  }
}

export async function deleteLmsQuestion(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const parsed = z.object({ id: idSchema }).safeParse({ id: str(formData, 'id').trim() });
  if (!parsed.success) {
    console.error('deleteLmsQuestion validation failed:', parsed.error.flatten());
    return { success: false, message: 'delete_failed' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('questions').delete().eq('id', parsed.data.id);
    if (error) throw error;

    const classSlug = str(formData, 'classSlug').trim();
    if (classSlugSchema.safeParse(classSlug).success) revalidateClassTree(classSlug);
    return { success: true, message: 'deleted' };
  } catch (error) {
    console.error('Failed to delete LMS question:', error);
    return { success: false, message: 'delete_failed' };
  }
}
