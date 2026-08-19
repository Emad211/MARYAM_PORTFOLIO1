// Seeds the remote Supabase project from src/lib/empty-data.ts and provisions
// the admin auth user. Idempotent: re-running upserts content and reconciles
// the admin user rather than duplicating anything.
//
// Uses the service-role key (bypasses RLS) — SERVER-SIDE ONLY. Reads secrets
// from .env.local via dotenv; nothing is hard-coded here.
//
//   node scripts/seed.mjs
//
// Registrations / messages / analytics are intentionally left empty.

import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { getEmptyCMSData } from '../src/lib/empty-data.ts';
import {
  postToRow,
  classToRow,
  timelineEventToInsert,
} from '../src/lib/supabase/mappers.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, '..', '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

for (const [name, val] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  ADMIN_EMAIL: adminEmail,
  ADMIN_PASSWORD: adminPassword,
})) {
  if (!val) {
    console.error(`ERROR: ${name} missing from .env.local`);
    process.exit(1);
  }
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const data = getEmptyCMSData();

// --- Admin auth user -------------------------------------------------------
async function ensureAdminUser() {
  // listUsers is paginated; a fresh project has a single admin, so page 1 covers it.
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
  );

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: adminPassword,
      email_confirm: true,
      app_metadata: { ...existing.app_metadata, role: 'admin' },
    });
    if (error) throw error;
    console.log(`Admin user reconciled (role=admin): ${adminEmail}`);
  } else {
    const { error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      app_metadata: { role: 'admin' },
    });
    if (error) throw error;
    console.log(`Admin user created (role=admin): ${adminEmail}`);
  }
}

// --- Content ---------------------------------------------------------------
async function seedSiteContent() {
  const rows = [
    { key: 'home', content: data.homeContent },
    { key: 'about', content: data.aboutContent },
    { key: 'contact', content: data.contactContent },
  ];
  const { error } = await supabase
    .from('site_content')
    .upsert(rows, { onConflict: 'key' });
  if (error) throw error;
  console.log(`site_content: upserted ${rows.length} rows (home/about/contact)`);
}

async function seedPosts() {
  const rows = data.posts.map(postToRow);
  const { error } = await supabase.from('posts').upsert(rows, { onConflict: 'slug' });
  if (error) throw error;
  console.log(`posts: upserted ${rows.length}`);
}

async function seedClasses() {
  const rows = data.classes.map(classToRow);
  const { error } = await supabase.from('classes').upsert(rows, { onConflict: 'slug' });
  if (error) throw error;
  console.log(`classes: upserted ${rows.length}`);
}

async function seedTimeline() {
  // No natural key on timeline_events — mirror saveTimeline: clear then insert
  // with positional sort_order.
  const { error: delErr } = await supabase
    .from('timeline_events')
    .delete()
    .not('id', 'is', null);
  if (delErr) throw delErr;
  const rows = data.timeline.map((e, i) => timelineEventToInsert(e, i));
  if (rows.length > 0) {
    const { error } = await supabase.from('timeline_events').insert(rows);
    if (error) throw error;
  }
  console.log(`timeline_events: reset + inserted ${rows.length}`);
}

async function main() {
  console.log('Seeding Supabase project ...\n');
  await ensureAdminUser();
  await seedSiteContent();
  await seedPosts();
  await seedClasses();
  await seedTimeline();

  // Verify counts.
  const counts = {};
  for (const t of ['site_content', 'posts', 'classes', 'timeline_events']) {
    const { count, error } = await supabase
      .from(t)
      .select('*', { count: 'exact', head: true });
    counts[t] = error ? `ERR: ${error.message}` : count;
  }
  console.log('\nRow counts:', counts);
  console.log('\nSeed complete.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message ?? err);
  process.exit(1);
});
