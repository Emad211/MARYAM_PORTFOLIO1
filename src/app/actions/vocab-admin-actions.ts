
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/supabase/auth-guard';
import type { LocalizedString } from '@/lib/types';

/**
 * Admin-side vocabulary authoring actions (decks → cards).
 *
 * Every action is gated by `isAdminRequest()` (defense-in-depth with the
 * admin RLS policies on `vocab_decks` / `vocab_cards`) and writes through
 * the request-bound Supabase client so RLS is exercised for real.
 */

export interface ActionResult {
  success: boolean;
  message: string;
  /** Populated on successful upsert so the client can link children immediately. */
  id?: string;
}

const DOMAINS = [
  'alltag',
  'studium',
  'umwelt',
  'arbeit_wirtschaft',
  'medien',
  'gesellschaft',
] as const;
const WORD_TYPES = ['noun', 'verb', 'adjective', 'phrase', 'other'] as const;

const idSchema = z.string().uuid();
const sortOrderSchema = z.coerce.number().int().min(0).default(0);

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

/**
 * Fully optional variant of `readLocalized`: returns null when all three
 * languages are blank; otherwise blanks fall back to the first non-empty
 * value so the stored jsonb never contains holes.
 */
function readOptionalLocalized(formData: FormData, prefix: string): LocalizedString | null {
  const en = str(formData, `${prefix}En`).trim();
  const de = str(formData, `${prefix}De`).trim();
  const fa = str(formData, `${prefix}Fa`).trim();
  if (!en && !de && !fa) return null;
  const fallback = fa || de || en;
  return { en: en || fallback, de: de || fallback, fa: fa || fallback };
}

const localizedSchema = z.object({
  en: z.string().min(1),
  de: z.string().min(1),
  fa: z.string().min(1),
});

function revalidateVocab(): void {
  revalidatePath('/admin/vocab');
}

// --- Decks ---

export async function upsertVocabDeck(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const rawId = str(formData, 'id').trim();
  const classSlugRaw = str(formData, 'classSlug').trim();
  const parsed = z
    .object({
      id: idSchema.optional(),
      title: localizedSchema,
      description: localizedSchema.optional(),
      domain: z.enum(DOMAINS),
      classSlug: z.string().max(120).optional(),
      isActive: z.boolean(),
    })
    .safeParse({
      ...(rawId ? { id: rawId } : {}),
      title: readLocalized(formData, 'title'),
      description: readLocalized(formData, 'description') ?? undefined,
      domain: str(formData, 'domain'),
      // Light validation only: '' → omitted (null column), otherwise passed
      // through — a bogus slug surfaces as an FK violation → save_failed.
      ...(classSlugRaw ? { classSlug: classSlugRaw } : {}),
      isActive: str(formData, 'isActive') === 'on',
    });

  if (!parsed.success) {
    console.error('upsertVocabDeck validation failed:', parsed.error.flatten());
    return { success: false, message: 'invalid_input' };
  }
  const { title, description, domain, classSlug, isActive } = parsed.data;

  try {
    const supabase = await createClient();
    const row = {
      title,
      domain,
      is_active: isActive,
      ...(description !== undefined ? { description } : {}),
      ...(classSlug !== undefined ? { class_slug: classSlug } : {}),
    };
    let savedId = parsed.data.id;
    if (savedId !== undefined) {
      const { error } = await supabase.from('vocab_decks').update(row).eq('id', savedId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('vocab_decks').insert(row).select('id').single();
      if (error) throw error;
      savedId = data?.id;
    }

    revalidateVocab();
    return { success: true, message: 'saved', ...(savedId ? { id: savedId } : {}) };
  } catch (error) {
    console.error('Failed to save vocab deck:', error);
    return { success: false, message: 'save_failed' };
  }
}

export async function deleteVocabDeck(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const parsed = z.object({ id: idSchema }).safeParse({ id: str(formData, 'id').trim() });
  if (!parsed.success) {
    console.error('deleteVocabDeck validation failed:', parsed.error.flatten());
    return { success: false, message: 'delete_failed' };
  }

  try {
    const supabase = await createClient();
    // Cards cascade via DB FKs.
    const { error } = await supabase.from('vocab_decks').delete().eq('id', parsed.data.id);
    if (error) throw error;

    revalidateVocab();
    return { success: true, message: 'deleted' };
  } catch (error) {
    console.error('Failed to delete vocab deck:', error);
    return { success: false, message: 'delete_failed' };
  }
}

// --- Cards ---

export async function upsertVocabCard(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const rawId = str(formData, 'id').trim();
  const exampleDe = str(formData, 'exampleDe').trim();
  const exampleEn = str(formData, 'exampleEn').trim();
  const exampleFa = str(formData, 'exampleFa').trim();
  const parsed = z
    .object({
      id: idSchema.optional(),
      deckId: idSchema,
      frontDe: z.string().min(1).max(200),
      wordType: z.enum(WORD_TYPES),
      hint: localizedSchema.optional(),
      exampleDe: z.string().max(500).optional(),
      exampleEn: z.string().max(500).optional(),
      exampleFa: z.string().max(500).optional(),
      sortOrder: sortOrderSchema,
    })
    .safeParse({
      ...(rawId ? { id: rawId } : {}),
      deckId: str(formData, 'deckId').trim(),
      frontDe: str(formData, 'frontDe').trim(),
      wordType: str(formData, 'wordType'),
      hint: readOptionalLocalized(formData, 'hint') ?? undefined,
      ...(exampleDe ? { exampleDe } : {}),
      ...(exampleEn ? { exampleEn } : {}),
      ...(exampleFa ? { exampleFa } : {}),
      sortOrder: str(formData, 'sortOrder').trim() === '' ? 0 : Number(str(formData, 'sortOrder')),
    });

  if (!parsed.success) {
    console.error('upsertVocabCard validation failed:', parsed.error.flatten());
    return { success: false, message: 'invalid_input' };
  }
  const {
    deckId,
    frontDe,
    wordType,
    hint,
    exampleDe: exDe,
    exampleEn: exEn,
    exampleFa: exFa,
    sortOrder,
  } = parsed.data;

  try {
    const supabase = await createClient();
    const row = {
      deck_id: deckId,
      front_de: frontDe,
      word_type: wordType,
      sort_order: sortOrder,
      ...(hint !== undefined ? { hint } : {}),
      ...(exDe !== undefined ? { example_de: exDe } : {}),
      ...(exEn !== undefined ? { example_en: exEn } : {}),
      ...(exFa !== undefined ? { example_fa: exFa } : {}),
    };
    let savedId = parsed.data.id;
    if (savedId !== undefined) {
      const { error } = await supabase.from('vocab_cards').update(row).eq('id', savedId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('vocab_cards').insert(row).select('id').single();
      if (error) throw error;
      savedId = data?.id;
    }

    revalidateVocab();
    return { success: true, message: 'saved', ...(savedId ? { id: savedId } : {}) };
  } catch (error) {
    console.error('Failed to save vocab card:', error);
    return { success: false, message: 'save_failed' };
  }
}

export async function deleteVocabCard(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const parsed = z.object({ id: idSchema }).safeParse({ id: str(formData, 'id').trim() });
  if (!parsed.success) {
    console.error('deleteVocabCard validation failed:', parsed.error.flatten());
    return { success: false, message: 'delete_failed' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('vocab_cards').delete().eq('id', parsed.data.id);
    if (error) throw error;

    revalidateVocab();
    return { success: true, message: 'deleted' };
  } catch (error) {
    console.error('Failed to delete vocab card:', error);
    return { success: false, message: 'delete_failed' };
  }
}
