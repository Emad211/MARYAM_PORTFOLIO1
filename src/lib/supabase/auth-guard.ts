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
