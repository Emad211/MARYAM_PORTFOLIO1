
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/supabase/auth-guard';
import type { LocalizedString } from '@/lib/types';

/**
 * Admin-side grammar bank authoring actions (topics + lesson links).
 *
 * Every action is gated by `isAdminRequest()` (defense-in-depth with the
 * admin RLS policies on `grammar_topics` / `lesson_grammar`) and writes
 * through the request-bound Supabase client so RLS is exercised for real.
 */

export interface ActionResult {
  success: boolean;
  message: string;
  /** Populated on successful upsert so the client can keep editing in place. */
  id?: string;
}

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const;

const idSchema = z.string().uuid();
const sortOrderSchema = z.coerce.number().int().min(0).default(0);
const slugSchema = z.string().regex(/^[a-z0-9-]{2,80}$/);

// --- FormData helpers ---

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
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

const exampleSchema = z.object({
  de: z.string(),
  en: z.string(),
  fa: z.string(),
});

/**
 * Parses the raw `examplesJson` textarea payload into a validated example
 * array. Empty string → []; malformed JSON or wrong shape → null.
 */
function parseExamples(raw: string): { de: string; en: string; fa: string }[] | null {
  if (raw.trim() === '') return [];
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = z.array(exampleSchema).max(12).safeParse(parsedJson);
  return result.success ? result.data : null;
}

/** Postgres unique-violation code → friendly "slug already taken" signal. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

function revalidateGrammar(): void {
  revalidatePath('/admin/grammar');
  revalidatePath('/grammar');
}

// --- Topics ---

export async function upsertGrammarTopic(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const rawId = str(formData, 'id').trim();
  const examplesRaw = str(formData, 'examplesJson');
  const lessonIds = formData
    .getAll('lessonIds')
    .filter((entry): entry is string => typeof entry === 'string');

  const parsed = z
    .object({
      id: idSchema.optional(),
      slug: slugSchema,
      title: localizedSchema,
      level: z.enum(LEVELS),
      explanation: localizedSchema,
      examples: z.array(exampleSchema).max(12),
      sortOrder: sortOrderSchema,
      lessonIds: z.array(idSchema),
    })
    .safeParse({
      ...(rawId ? { id: rawId } : {}),
      slug: str(formData, 'slug').trim(),
      title: readLocalized(formData, 'title'),
      level: str(formData, 'level'),
      explanation: readLocalized(formData, 'explanation'),
      examples: parseExamples(examplesRaw),
      sortOrder: str(formData, 'sortOrder').trim() === '' ? 0 : Number(str(formData, 'sortOrder')),
      lessonIds,
    });

  if (!parsed.success) {
    // Distinguish "the JSON textarea didn't parse" from other field problems.
    const examplesInvalid = parsed.error.flatten().fieldErrors.examples !== undefined;
    console.error('upsertGrammarTopic validation failed:', parsed.error.flatten());
    return { success: false, message: examplesInvalid ? 'invalid_examples' : 'invalid_input' };
  }
  const { slug, title, level, explanation, examples, sortOrder, lessonIds: linkedLessonIds } =
    parsed.data;

  try {
    const supabase = await createClient();
    const row = {
      slug,
      title,
      level,
      explanation,
      examples,
      sort_order: sortOrder,
    };
    let savedId = parsed.data.id;
    if (savedId !== undefined) {
      const { error } = await supabase.from('grammar_topics').update(row).eq('id', savedId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('grammar_topics').insert(row).select('id').single();
      if (error) throw error;
      savedId = data?.id;
    }

    if (!savedId) throw new Error('grammar_topics write returned no id');

    // REPLACE semantics for lesson links: wipe this topic's links, then
    // insert only the currently checked lessons.
    const deleteResult = await supabase.from('lesson_grammar').delete().eq('topic_id', savedId);
    if (deleteResult.error) throw deleteResult.error;

    if (linkedLessonIds.length > 0) {
      const insertResult = await supabase
        .from('lesson_grammar')
        .insert(
          linkedLessonIds.map((lessonId) => ({ lesson_id: lessonId, topic_id: savedId as string }))
        );
      if (insertResult.error) throw insertResult.error;
    }

    revalidateGrammar();
    return { success: true, message: 'saved', id: savedId };
  } catch (error) {
    if (isUniqueViolation(error)) {
      console.error('upsertGrammarTopic: slug already taken');
      return { success: false, message: 'slug_taken' };
    }
    console.error('Failed to save grammar topic:', error);
    return { success: false, message: 'save_failed' };
  }
}

export async function deleteGrammarTopic(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const parsed = z.object({ id: idSchema }).safeParse({ id: str(formData, 'id').trim() });
  if (!parsed.success) {
    console.error('deleteGrammarTopic validation failed:', parsed.error.flatten());
    return { success: false, message: 'delete_failed' };
  }

  try {
    const supabase = await createClient();
    // lesson_grammar rows cascade via DB FKs.
    const { error } = await supabase.from('grammar_topics').delete().eq('id', parsed.data.id);
    if (error) throw error;

    revalidateGrammar();
    return { success: true, message: 'deleted' };
  } catch (error) {
    console.error('Failed to delete grammar topic:', error);
    return { success: false, message: 'delete_failed' };
  }
}
