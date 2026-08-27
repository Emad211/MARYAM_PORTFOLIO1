import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — SERVER ONLY.
 *
 * ⚠️ Bypasses Row Level Security entirely. Never import this into a Client
 * Component or expose the key to the browser (`server-only` enforces this at
 * build time). Use only for privileged server-side work that genuinely needs
 * to bypass RLS: seeding, and Auth Admin operations (creating/updating the
 * admin user, setting app_metadata). For normal request-scoped reads/writes
 * use the request-bound client in `server.ts` so RLS applies.
 *
 * Auth is disabled (no session persistence / token refresh) because this
 * client authenticates purely via the service-role key.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // Fail with an actionable message instead of supabase-js's bare
    // "supabaseKey is required" — this only ever happens in local dev
    // where .env.local lacks the service key (production/Vercel has it).
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local ' +
        '(Supabase Dashboard → Project Settings → API → service_role key) ' +
        'and restart the dev server.'
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
