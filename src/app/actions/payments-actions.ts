'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAdminRequest, studentUserId } from '@/lib/supabase/auth-guard';
import type { PaymentRecord } from '@/lib/types';

/**
 * Tuition bookkeeping actions — manual records only, no gateway integration.
 *
 * Student side: `getMyPayments` is gated by `studentUserId()` and reads through
 * the request-bound client so owner-scoped RLS is exercised for real; a failed
 * gate simply yields an empty history (never another student's rows).
 * Admin side: every read/mutation is gated by `isAdminRequest()` —
 * defense-in-depth alongside the admin RLS policies on `payments`.
 */

export interface ActionResult {
  success: boolean;
  message: string;
}

// --- Constants mirroring the `payments` CHECK constraints ---

const CURRENCIES = ['EUR', 'USD', 'IRR'] as const;
const METHODS = ['cash', 'bank_transfer', 'card', 'other'] as const;
const STATUSES = ['pending', 'confirmed', 'failed'] as const;

const MAX_AMOUNT = 100_000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// --- Row shape + mapper (Postgres `numeric` arrives as a STRING) ---

interface PaymentRow {
  id: string;
  user_id: string;
  class_slug: string | null;
  amount: string | number;
  currency: string;
  method: string;
  status: string;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  note: string | null;
  created_at: string;
}

function toPaymentRecord(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    ...(row.class_slug ? { classSlug: row.class_slug } : {}),
    amount: Number(row.amount),
    currency: row.currency as PaymentRecord['currency'],
    method: row.method as PaymentRecord['method'],
    status: row.status as PaymentRecord['status'],
    ...(row.paid_at ? { paidAt: row.paid_at } : {}),
    ...(row.period_start ? { periodStart: row.period_start } : {}),
    ...(row.period_end ? { periodEnd: row.period_end } : {}),
    ...(row.note ? { note: row.note } : {}),
    createdAt: row.created_at,
  };
}

// --- FormData helpers (house style) ---

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

/** Accepts datetime-local OR a full ISO stamp → UTC ISO; null when unparseable. */
function toIsoDateTime(raw: string): string | null {
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// --- Student side ---

export async function getMyPayments(): Promise<PaymentRecord[]> {
  const userId = await studentUserId();
  if (!userId) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as PaymentRow[]).map(toPaymentRecord);
  } catch (error) {
    console.error('Failed to load student payments:', error);
    return [];
  }
}

// --- Admin side ---

export async function listStudents(): Promise<Array<{ userId: string; label: string }>> {
  if (!(await isAdminRequest())) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('list_students');
    if (error) throw error;
    const rows = (data ?? []) as Array<{ user_id: string; email: string; full_name: string }>;
    return rows.map((row) => ({
      userId: row.user_id,
      label: `${row.full_name} (${row.email})`,
    }));
  } catch (error) {
    console.error('Failed to list students:', error);
    return [];
  }
}

export async function getAllPayments(): Promise<Array<PaymentRecord & { studentName: string }>> {
  if (!(await isAdminRequest())) return [];

  try {
    const supabase = await createClient();
    const [paymentsResult, students] = await Promise.all([
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(300),
      listStudents(),
    ]);
    if (paymentsResult.error) throw paymentsResult.error;

    const nameByUser = new Map(students.map((s) => [s.userId, s.label]));
    return ((paymentsResult.data ?? []) as PaymentRow[]).map((row) => ({
      ...toPaymentRecord(row),
      studentName: nameByUser.get(row.user_id) ?? row.user_id.slice(0, 8),
    }));
  } catch (error) {
    console.error('Failed to load all payments:', error);
    return [];
  }
}

export async function recordPayment(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const classSlugRaw = str(formData, 'classSlug').trim();
  const noteRaw = str(formData, 'note').trim();
  const paidAtRaw = str(formData, 'paidAtLocal').trim();
  const periodStartRaw = str(formData, 'periodStart').trim();
  const periodEndRaw = str(formData, 'periodEnd').trim();

  // Optional datetimes/dates are normalized before zod so every failure maps
  // to the single stable `invalid_input` message key.
  const paidAtIso = paidAtRaw ? toIsoDateTime(paidAtRaw) : undefined;
  if (paidAtRaw && !paidAtIso) return { success: false, message: 'invalid_input' };
  const periodStart = DATE_ONLY_PATTERN.test(periodStartRaw) ? periodStartRaw : undefined;
  if (periodStartRaw && !periodStart) return { success: false, message: 'invalid_input' };
  const periodEnd = DATE_ONLY_PATTERN.test(periodEndRaw) ? periodEndRaw : undefined;
  if (periodEndRaw && !periodEnd) return { success: false, message: 'invalid_input' };

  const amountRaw = str(formData, 'amount').trim();
  const parsed = z
    .object({
      userId: z.string().uuid(),
      classSlug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
      amount: z.number().gt(0).lte(MAX_AMOUNT),
      currency: z.enum(CURRENCIES),
      method: z.enum(METHODS),
      status: z.enum(STATUSES),
      note: z.string().max(500).optional(),
    })
    .safeParse({
      userId: str(formData, 'userId').trim(),
      ...(classSlugRaw ? { classSlug: classSlugRaw } : {}),
      amount: amountRaw === '' ? NaN : Number(amountRaw),
      currency: str(formData, 'currency') || 'EUR',
      method: str(formData, 'method'),
      status: str(formData, 'status') || 'pending',
      ...(noteRaw ? { note: noteRaw } : {}),
    });

  if (!parsed.success) {
    console.error('recordPayment validation failed:', parsed.error.flatten());
    return { success: false, message: 'invalid_input' };
  }

  // The target must be a real student account — the rpc is the admin roster.
  const roster = await listStudents();
  if (!roster.some((student) => student.userId === parsed.data.userId)) {
    return { success: false, message: 'invalid_input' };
  }

  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const adminId = userData?.user?.id;

    const { error } = await supabase.from('payments').insert({
      user_id: parsed.data.userId,
      ...(parsed.data.classSlug !== undefined ? { class_slug: parsed.data.classSlug } : {}),
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      method: parsed.data.method,
      status: parsed.data.status,
      ...(paidAtIso !== undefined ? { paid_at: paidAtIso } : {}),
      ...(periodStart !== undefined ? { period_start: periodStart } : {}),
      ...(periodEnd !== undefined ? { period_end: periodEnd } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note } : {}),
      ...(adminId ? { recorded_by: adminId } : {}),
    });
    if (error) throw error;

    revalidatePath('/admin/payments');
    return { success: true, message: 'saved' };
  } catch (error) {
    console.error('Failed to record payment:', error);
    return { success: false, message: 'save_failed' };
  }
}

export async function updatePaymentStatus(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const paidAtRaw = str(formData, 'paidAtLocal').trim();
  const paidAtIso = paidAtRaw ? toIsoDateTime(paidAtRaw) : undefined;
  if (paidAtRaw && !paidAtIso) return { success: false, message: 'invalid_input' };

  const parsed = z
    .object({ id: z.string().uuid(), status: z.enum(STATUSES) })
    .safeParse({ id: str(formData, 'id').trim(), status: str(formData, 'status') });

  if (!parsed.success) {
    console.error('updatePaymentStatus validation failed:', parsed.error.flatten());
    return { success: false, message: 'invalid_input' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('payments')
      .update({
        status: parsed.data.status,
        // Stamp paid_at only when confirming AND the caller supplied a date.
        ...(parsed.data.status === 'confirmed' && paidAtIso !== undefined
          ? { paid_at: paidAtIso }
          : {}),
      })
      .eq('id', parsed.data.id);
    if (error) throw error;

    revalidatePath('/admin/payments');
    return { success: true, message: 'updated' };
  } catch (error) {
    console.error('Failed to update payment status:', error);
    return { success: false, message: 'invalid_input' };
  }
}

export async function deletePayment(formData: FormData): Promise<ActionResult> {
  if (!(await isAdminRequest())) return { success: false, message: 'unauthorized' };

  const parsed = z.object({ id: z.string().uuid() }).safeParse({ id: str(formData, 'id').trim() });
  if (!parsed.success) {
    console.error('deletePayment validation failed:', parsed.error.flatten());
    return { success: false, message: 'delete_failed' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('payments').delete().eq('id', parsed.data.id);
    if (error) throw error;

    revalidatePath('/admin/payments');
    return { success: true, message: 'deleted' };
  } catch (error) {
    console.error('Failed to delete payment:', error);
    return { success: false, message: 'delete_failed' };
  }
}
