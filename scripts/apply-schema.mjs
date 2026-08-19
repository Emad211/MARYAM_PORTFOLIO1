// Applies the committed SQL migration to the remote Supabase project via the
// Management API, then verifies the resulting schema.
//
// The migration is idempotent (create ... if not exists / drop policy if exists
// / create or replace / revoke+grant), so this is safe to run repeatedly.
//
// Requires the Management API personal access token in the environment:
//   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-schema.mjs
// The token is a credential — never write it to a file or commit it.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PROJECT_REF = 'uptxnousjzidadoviavu';
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error('ERROR: SUPABASE_ACCESS_TOKEN not set in environment.');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '20260819011441_init_cms_schema.sql'
);

async function runSql(query, label) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );
  const text = await res.text();
  if (!res.ok) {
    console.error(`[${label}] HTTP ${res.status}: ${text}`);
    throw new Error(`SQL request failed (${label})`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const sql = readFileSync(migrationPath, 'utf8');
console.log(`Applying migration (${sql.length} bytes) to project ${PROJECT_REF} ...`);
await runSql(sql, 'apply-migration');
console.log('Migration applied.');

console.log('\nVerifying tables + RLS ...');
const tables = await runSql(
  `select c.relname as table, c.relrowsecurity as rls_enabled
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
   order by c.relname;`,
  'verify-tables'
);
console.table(tables);

const policies = await runSql(
  `select schemaname, tablename, count(*) as policy_count
   from pg_policies where schemaname = 'public'
   group by schemaname, tablename order by tablename;`,
  'verify-policies'
);
console.table(policies);

const fn = await runSql(
  `select proname, prosecdef as security_definer
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'is_admin';`,
  'verify-function'
);
console.table(fn);

console.log('\nSchema apply + verify complete.');
