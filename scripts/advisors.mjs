// Queries the Supabase Management API for security & performance advisories.
// Read-only. Reads the personal access token from SUPABASE_ACCESS_TOKEN (env
// only — never a committed file):
//
//   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/advisors.mjs
//
// Mirrors the MCP `get_advisors` tool when MCP isn't authenticated.

const PROJECT_REF = 'uptxnousjzidadoviavu';
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error('ERROR: SUPABASE_ACCESS_TOKEN missing from env');
  process.exit(1);
}

async function getAdvisors(kind) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/advisors/${kind}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    throw new Error(`${kind}: HTTP ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function report(kind, payload) {
  const lints = payload.lints ?? [];
  if (lints.length === 0) {
    console.log(`\n${kind.toUpperCase()}: no advisories ✔`);
    return 0;
  }
  console.log(`\n${kind.toUpperCase()}: ${lints.length} advisor(y|ies)`);
  for (const l of lints) {
    console.log(
      `  [${l.level}] ${l.name} — ${l.title}` +
        (l.metadata?.name ? ` (${l.metadata.name})` : '')
    );
    if (l.detail) console.log(`      ${l.detail.replace(/<\/?[^>]+>/g, '')}`);
  }
  return lints.filter((l) => l.level === 'ERROR').length;
}

async function main() {
  const [security, performance] = await Promise.all([
    getAdvisors('security'),
    getAdvisors('performance'),
  ]);
  const errs = report('security', security) + report('performance', performance);
  console.log(
    errs > 0
      ? `\n${errs} ERROR-level advisor(y|ies) — review above.`
      : '\nNo ERROR-level advisories.'
  );
}

main().catch((err) => {
  console.error('\nAdvisors query failed:', err.message ?? err);
  process.exit(1);
});
