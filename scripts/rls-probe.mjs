// Verifies the RLS policy model using the PUBLISHABLE (anon) key — the exact
// key the browser uses. This is the real security boundary: it must allow
// public reads of content and public inserts of submissions, while blocking
// anon from reading submissions or mutating content.
//
// Section 5 additionally proves the Phase 1 enrollment model with a REAL
// authenticated student session: a student sees only their own rows, cannot
// self-approve, cannot touch another student's row (IDOR), cannot self-insert
// an 'approved' row, and cannot delete. Those setup/teardown steps use the
// service-role key; every *assertion* runs through the anon or student client
// (the true trust levels).
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing');
  process.exit(1);
}

// anon client, no session — identical trust level to an unauthenticated browser.
const anon = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// service-role client — used ONLY to set up/tear down test fixtures and to
// read ground truth for assertions. Never used to make a security claim.
const admin = serviceKey
  ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

/** A fresh anon-key client (its own in-memory session) we can sign a user into. */
function freshClient() {
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

let pass = 0;
let fail = 0;
function check(label, ok, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);
  ok ? pass++ : fail++;
}

// ---------------------------------------------------------------------------
// Section 5 — enrollment / profiles (authenticated student trust boundary).
// Creates two throwaway students, gives each a pending enrollment, then drives
// the anon + student clients against the policies. Always tears the users down.
// ---------------------------------------------------------------------------
async function enrollmentChecks() {
  if (!admin) {
    check('enrollment RLS suite (needs SUPABASE_SERVICE_ROLE_KEY)', false,
      'service-role key missing from .env.local — skipping student boundary tests');
    return;
  }

  const pw = 'Probe-Passw0rd!';
  const stamp = Date.now();
  const emailA = `rls-probe-a-${stamp}@example.com`;
  const emailB = `rls-probe-b-${stamp}@example.com`;
  let idA = null;
  let idB = null;

  try {
    // Two distinct real class slugs (FK target). Need 2 so student A can attempt
    // a second, forbidden 'approved' insert without hitting the unique(user,class).
    const { data: classRows, error: classErr } = await anon
      .from('classes').select('slug').limit(2);
    if (classErr || !classRows || classRows.length === 0) {
      check('enrollment suite setup: found a class slug', false,
        classErr ? classErr.message : 'no classes seeded');
      return;
    }
    const slug1 = classRows[0].slug;
    const slug2 = classRows[1]?.slug ?? null; // may be null if only one class

    // Create both students (auto-confirmed, server-set student role).
    for (const email of [emailA, emailB]) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email, password: pw, email_confirm: true, app_metadata: { role: 'student' },
      });
      if (error || !created.user) {
        check(`enrollment suite setup: created ${email}`, false, error?.message ?? 'no user');
        return;
      }
      if (email === emailA) idA = created.user.id;
      else idB = created.user.id;
    }

    // Profiles + a pending enrollment for each (service-role bypasses RLS).
    const { error: profErr } = await admin.from('profiles').upsert([
      { id: idA, name: 'Probe A', phone: '111' },
      { id: idB, name: 'Probe B', phone: '222' },
    ]);
    if (profErr) { check('enrollment suite setup: profiles', false, profErr.message); return; }

    const { error: enrErr } = await admin.from('enrollments').insert([
      { user_id: idA, class_slug: slug1, status: 'pending' },
      { user_id: idB, class_slug: slug1, status: 'pending' },
    ]);
    if (enrErr) { check('enrollment suite setup: enrollments', false, enrErr.message); return; }

    const { data: enrRowA } = await admin
      .from('enrollments').select('id').eq('user_id', idA).eq('class_slug', slug1).single();
    const enrIdA = enrRowA?.id;

    // --- anon must be shut out of both new tables entirely -------------------
    {
      const { data } = await anon.from('profiles').select('id');
      check('anon CANNOT read profiles', (data?.length ?? 0) === 0, `${data?.length ?? 0} rows visible`);
    }
    {
      const { data } = await anon.from('enrollments').select('id');
      check('anon CANNOT read enrollments', (data?.length ?? 0) === 0, `${data?.length ?? 0} rows visible`);
    }
    {
      const { error } = await anon.from('enrollments')
        .insert({ user_id: idA, class_slug: slug1, status: 'pending' });
      check('anon CANNOT insert enrollments', !!error, error ? error.message : 'insert unexpectedly succeeded');
    }

    // --- sign in as student A -----------------------------------------------
    const studentA = freshClient();
    const { error: signInErr } = await studentA.auth.signInWithPassword({ email: emailA, password: pw });
    if (signInErr) { check('enrollment suite: student A sign-in', false, signInErr.message); return; }

    // A reads enrollments: sees own, never B's.
    {
      const { data, error } = await studentA.from('enrollments').select('id, user_id, status');
      const rows = data ?? [];
      const seesOwn = rows.some((r) => r.user_id === idA);
      const seesB = rows.some((r) => r.user_id === idB);
      check('student sees own enrollment', !error && seesOwn, error ? error.message : `${rows.length} rows`);
      check('student CANNOT see another student\'s enrollment', !seesB,
        seesB ? "B's row leaked into A's result" : 'only own rows');
    }

    // A reads profiles: sees own, never B's.
    {
      const { data } = await studentA.from('profiles').select('id');
      const ids = (data ?? []).map((r) => r.id);
      check('student CANNOT read another student\'s profile', !ids.includes(idB),
        ids.includes(idB) ? "B's profile leaked" : `${ids.length} row(s), own only`);
    }

    // A tries to self-approve own row → WITH CHECK violation (error), status unchanged.
    {
      const { error } = await studentA.from('enrollments')
        .update({ status: 'approved' }).eq('id', enrIdA).select();
      const { data: truth } = await admin.from('enrollments').select('status').eq('id', enrIdA).single();
      check('student CANNOT self-approve', !!error && truth?.status === 'pending',
        error ? `blocked (${truth?.status})` : `NOT blocked (status=${truth?.status})`);
    }

    // A tries to mutate B's row (IDOR) → USING filters it out → 0 rows, B untouched.
    {
      const { data } = await studentA.from('enrollments')
        .update({ status: 'cancelled' }).eq('user_id', idB).select();
      const { data: truthB } = await admin
        .from('enrollments').select('status').eq('user_id', idB).eq('class_slug', slug1).single();
      check('student CANNOT modify another student\'s enrollment (IDOR)',
        (data?.length ?? 0) === 0 && truthB?.status === 'pending',
        `${data?.length ?? 0} rows affected, B.status=${truthB?.status}`);
    }

    // A tries to self-insert an 'approved' row for a different class → WITH CHECK error.
    if (slug2) {
      const { error } = await studentA.from('enrollments')
        .insert({ user_id: idA, class_slug: slug2, status: 'approved' }).select();
      check('student CANNOT self-insert an approved enrollment', !!error,
        error ? 'blocked' : 'insert unexpectedly succeeded');
    } else {
      console.log('SKIP  student self-insert-approved test — only one class seeded');
    }

    // A tries to delete own row → DELETE is admin-only → 0 rows, row survives.
    {
      const { data } = await studentA.from('enrollments').delete().eq('id', enrIdA).select();
      const { data: still } = await admin.from('enrollments').select('id').eq('id', enrIdA);
      check('student CANNOT delete an enrollment',
        (data?.length ?? 0) === 0 && (still?.length ?? 0) === 1,
        `${data?.length ?? 0} rows deleted`);
    }

    // A CAN cancel own pending row (legitimate withdrawal). Do this last.
    {
      const { data, error } = await studentA.from('enrollments')
        .update({ status: 'cancelled' }).eq('id', enrIdA).select();
      check('student CAN cancel own pending enrollment', !error && (data?.length ?? 0) === 1,
        error ? error.message : `${data?.length ?? 0} row(s) → cancelled`);
    }
  } finally {
    // Tear down: deleting the auth users cascades to profiles + enrollments.
    for (const id of [idA, idB]) {
      if (id) await admin.auth.admin.deleteUser(id).catch(() => {});
    }
  }
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

  // 5. Enrollment + profiles (authenticated student boundary).
  await enrollmentChecks();

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('\nRLS probe crashed:', err.message ?? err);
  process.exit(1);
});
