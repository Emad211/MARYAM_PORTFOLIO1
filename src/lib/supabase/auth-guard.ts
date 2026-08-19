import 'server-only';
import { createClient } from './server';

/**
 * Returns true only if the current request carries a valid Supabase session
 * whose server-controlled role is `admin`.
 *
 * Uses `getUser()` (revalidates the JWT with the auth server) and reads
 * `app_metadata.role` — never `user_metadata`, which is user-editable and
 * unsafe for authorization. Use this to gate every content-write Server
 * Action; it is defense-in-depth alongside RLS (`public.is_admin()`), not a
 * replacement for it.
 */
export async function isAdminRequest(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return false;
  return (data.user.app_metadata as { role?: string } | undefined)?.role === 'admin';
}

/**
 * Returns the authenticated user's id only if their server-controlled role is
 * `student`, else null. Same JWT-revalidating `getUser()` + `app_metadata`
 * rules as `isAdminRequest`. Enrollment actions need the id (to scope the row
 * to its owner), so this returns it rather than a bare boolean; RLS enforces
 * owner-scoping again at the database.
 */
export async function studentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const role = (data.user.app_metadata as { role?: string } | undefined)?.role;
  return role === 'student' ? data.user.id : null;
}

