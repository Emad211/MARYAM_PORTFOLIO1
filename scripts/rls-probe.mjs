// Verifies the RLS policy model using the PUBLISHABLE (anon) key — the exact
// key the browser uses. This is the real security boundary: it must allow
// public reads of content and public inserts of submissions, while blocking
// anon from reading submissions or mutating content.
//
//   node scripts/rls-probe.mjs        (reads .env.local via dotenv)

import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, '..', '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing');
  process.exit(1);
}

// anon client, no session — identical trust level to an unauthenticated browser.
const anon = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let pass = 0;
let fail = 0;
function check(label, ok, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);
  ok ? pass++ : fail++;
}

async function main() {
  // 1. Public READ of content tables must work.
  {
    const { data, error } = await anon.from('posts').select('slug').limit(5);
    check('anon can read posts (public content)', !error && (data?.length ?? 0) > 0,
      error ? error.message : `${data?.length} rows`);
  }
  {
    const { data, error } = await anon.from('classes').select('slug').limit(5);
    check('anon can read classes', !error && (data?.length ?? 0) > 0,
      error ? error.message : `${data?.length} rows`);
  }
  {
    const { data, error } = await anon.from('site_content').select('key');
    check('anon can read site_content', !error && (data?.length ?? 0) === 3,
      error ? error.message : `${data?.length} rows`);
  }
  {
    const { data, error } = await anon.from('timeline_events').select('id');
    check('anon can read timeline_events', !error && (data?.length ?? 0) > 0,
      error ? error.message : `${data?.length} rows`);
  }

  // 2. Public INSERT of submissions must work (contact form, registration, analytics).
  {
    const { error } = await anon.from('contact_messages').insert({
      name: 'RLS Probe', email: 'probe@example.com',
      subject: 'probe', message: 'probe',
      submitted_at: '2026-08-19T00:00:00.000Z',
    });
    check('anon can insert contact_messages (contact form)', !error,
      error ? error.message : 'inserted');
  }
  {
    const { error } = await anon.from('class_registrations').insert({
      name: 'RLS Probe', email: 'probe@example.com', phone: '000',
      class_name: 'probe', class_slug: 'probe',
      submitted_at: '2026-08-19T00:00:00.000Z',
    });
    check('anon can insert class_registrations (registration form)', !error,
      error ? error.message : 'inserted');
  }
  {
    const { error } = await anon.from('page_views').insert({
      path: '/probe', viewed_at: '2026-08-19T00:00:00.000Z',
      ip: '0.0.0.0', user_agent: 'probe', referrer: null,
    });
    check('anon can insert page_views (analytics)', !error,
      error ? error.message : 'inserted');
  }

  // 3. Anon must NOT be able to READ submissions back (no select policy).
  {
    const { data, error } = await anon.from('contact_messages').select('id');
    // RLS with no anon SELECT policy returns 0 rows (not an error).
    check('anon CANNOT read contact_messages', (data?.length ?? 0) === 0,
      error ? error.message : `${data?.length} rows visible`);
  }
  {
    const { data, error } = await anon.from('class_registrations').select('id');
    check('anon CANNOT read class_registrations', (data?.length ?? 0) === 0,
      error ? error.message : `${data?.length} rows visible`);
  }
  {
    const { data, error } = await anon.from('page_views').select('id');
    check('anon CANNOT read page_views', (data?.length ?? 0) === 0,
      error ? error.message : `${data?.length} rows visible`);
  }

  // 4. Anon must NOT be able to MUTATE content.
  {
    const { data, error } = await anon.from('posts')
      .update({ author: 'hacked' }).eq('slug', 'welcome-to-fluentia').select();
    // Blocked either by error or by 0 rows affected (no matching row visible for update).
    check('anon CANNOT update posts', (data?.length ?? 0) === 0,
      error ? error.message : `${data?.length} rows updated`);
  }
  {
    const { data, error } = await anon.from('posts').delete().neq('slug', '__none__').select();
    check('anon CANNOT delete posts', (data?.length ?? 0) === 0,
      error ? error.message : `${data?.length} rows deleted`);
  }
  {
    const { error } = await anon.from('site_content')
      .update({ content: {} }).eq('key', 'home');
    const { data: after } = await anon.from('site_content').select('content').eq('key', 'home').single();
    const homeStillPopulated = after?.content && Object.keys(after.content).length > 0;
    check('anon CANNOT wipe site_content', !!homeStillPopulated,
      error ? error.message : 'content intact');
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('\nRLS probe crashed:', err.message ?? err);
  process.exit(1);
});
