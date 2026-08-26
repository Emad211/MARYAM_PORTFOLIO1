# AGENTS.md — Complete Project Knowledge Base

> **Purpose:** Permanent, self-contained documentation for any AI agent (opencode/Claude/etc.) working on this repo. Read this BEFORE making changes.
> **Generated:** 2026-08-22 via multi-agent deep analysis of every file in the repo.

---

## 1. Project Identity

- **Folder:** `MARYAM_PORTFOLIO1` · **Git branch:** `main` · **package name:** `nextn`
- **What it is:** Trilingual (EN / DE / FA) portfolio + CMS website for **Maryam**, a German-language teacher (TestDaF examiner). Public site + admin CMS + student accounts with enrollment approval workflow.
- **Brand naming inconsistency (IMPORTANT):** The app is branded **"Fluentia"** in root metadata (`src/app/layout.tsx`) and seed data (`src/lib/empty-data.ts`), but legacy code (`src/lib/seo.ts`, `src/components/layout/metadata.tsx`, blog author defaults) still says **"LinguaSage"**. Domain hardcoded in legacy SEO: `linguasage.com`. Do not "fix" blindly — ask which brand wins first.
- **Language default:** Persian (`fa`), RTL. No URL-based locales — language lives purely in React client state and **resets to `fa` on reload** (no persistence).

## 2. Tech Stack

| Layer | Technology | Version notes |
|---|---|---|
| Framework | Next.js **16.1.1** App Router | Turbopack dev; `middleware.ts` convention renamed → **`proxy.ts`** (function must be named `proxy`) |
| React | 18.3 | |
| Language | TypeScript 5 strict+ | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch` |
| Styling | Tailwind CSS 3.4 + shadcn/ui (35 Radix primitives in `src/components/ui/`) | darkMode: `'class'`; plugins: tailwindcss-animate, @tailwindcss/typography |
| Fonts | Inter (body) + Playfair Display (headlines) via next/font, CSS vars `--font-inter`, `--font-playfair` |
| Backend | Supabase (Postgres 17 + Auth/GoTrue + RLS) | `@supabase/ssr@0.12.4`, `supabase-js@2.112.3` |
| Forms | react-hook-form + zod + zodResolver (contact form only); admin editors use plain `<form action>`; enrollment uses manual FormData + server zod |
| Charts | Recharts (admin analytics) | wrapped in shadcn ChartContainer, SSR-guarded via `isClient` flag |
| Animation | CSS/Tailwind only | ⚠️ `framer-motion` is declared in package.json but imported NOWHERE |
| Tests | Vitest 4 + happy-dom (unit), Playwright (e2e, Chromium only) |
| Deploy targets | Firebase App Hosting (`apphosting.yaml`, maxInstances 1) AND Vercel (`.vercelignore`) — both configured |

## 3. Directory Map

```
src/
├── proxy.ts                  # Next 16 middleware → updateSession() auth gate
├── app/
│   ├── layout.tsx            # Root: fonts, providers, ONLY real Metadata export ("Fluentia")
│   ├── not-found.tsx         # Client, trilingual
│   ├── (main)/               # PUBLIC site group (client shell layout w/ AnalyticsTracker)
│   │   ├── page.tsx          # Home — Server, ISR revalidate=3600
│   │   ├── about/page.tsx    # ISR 3600 (about + timeline)
│   │   ├── blog/page.tsx     # ISR 3600 (posts)
│   │   ├── blog/[slug]/      # ISR + generateStaticParams
│   │   ├── classes/[slug]/   # ISR + SSG params; enrollment state fetched CLIENT-side deliberately
│   │   └── contact/page.tsx  # ISR 3600
│   ├── login/page.tsx        # Client, Suspense-wrapped (useSearchParams); honors ?redirect=
│   ├── signup/page.tsx       # Client → signUpStudent action → auto-login
│   ├── dashboard/            # STUDENT area: client layout gate + server page (own enrollments)
│   ├── admin/
│   │   ├── page.tsx          # Analytics dashboard (getAnalyticsData → Recharts)
│   │   ├── blog/{new,edit/[slug]}   # CRUD posts (force-dynamic lists/edit)
│   │   ├── classes/{new,edit/[slug]}
│   │   ├── content/edit/[slug]/     # NO index route! reached from settings links (home/about/contact)
│   │   ├── deploy/page.tsx   # Static trilingual PM2+Apache deploy guide
│   │   ├── messages/         # contact_messages table view
│   │   ├── registrations/    # Enrollment approvals (legacy name kept for links/tests)
│   │   └── settings/{account}/ # account = change own email/password (re-auth flow)
│   └── actions/              # 'use server' modules:
│       ├── content-actions.ts      # requireAdmin-gated CRUD + updateUserCredentials
│       ├── user-actions.ts         # contact messages + DEPRECATED class_registrations trio
│       ├── enrollment-actions.ts   # signUpStudent, enroll/cancel/approve/reject (+capacity logic)
│       └── analytics-actions.ts    # trackPageView, getAnalyticsData (in-memory aggregation)
├── components/               # home/, about/, blog/, classes/, contact/, dashboard/,
│                             # layout/ (header/footer/lang-switcher/legacy-metadata), admin/*, ui/*(shadcn)
├── context/                  # language-context (fa default, sets html lang/dir), auth-context, language-context-wrapper (UNUSED render-prop legacy)
├── hooks/                    # use-toast (shadcn), use-performance-monitoring, use-mobile, use-accessibility
└── lib/
    ├── types.ts              # ALL domain types (trilingual LocalizedString everywhere)
    ├── cms-store.ts          # 'server-only' data layer — THE store
    ├── empty-data.ts         # fallback seed data (doubles as seed source)
    ├── type-utils.ts         # getValidLocale(date-fns faIR/enUS/de), safe-access helpers
    ├── seo.ts                # generateSEOMetadata — UNUSED template w/ placeholder stubs
    └── supabase/             # server.ts (createClient request-bound + createPublicClient cookie-less),
                              # browser.ts, admin.ts (service-role, server-only), middleware.ts (updateSession),
                              # auth-guard.ts (isAdminRequest/studentUserId), mappers.ts (19 row↔model fns)
supabase/migrations/          # 2 SQL migrations (init_cms_schema + add_student_enrollment)
scripts/                      # seed.mjs, rls-probe.mjs, apply-schema.mjs, advisors.mjs,
                              # parse-axe-reports.js (CI), bundle-analysis.ps1 (STALE — points at other project)
tests/                        # e2e/*.spec.ts, unit/utils.spec.ts, console suites (*.js), README (fa)
.github/workflows/ci.yml      # CI pipeline
```

## 4. Core Architecture Rules (DO NOT BREAK)

### 4.1 Three Supabase client patterns — rendering depends on which you pick
1. **Request-bound** (`await createClient()` from `lib/supabase/server`): cookies via `await cookies()` → RLS applies, acts as logged-in user. **Any read through it forces DYNAMIC rendering.** Use for all writes/admin reads/per-user data.
2. **Cookie-less public anon** (`createPublicClient()`): plain supabase-js, no cookies touch → enables **ISR/static** for public reads (`site_content`, `posts`, `classes`, `timeline_events`). NEVER use for per-user or write paths.
3. **Service-role** (`createAdminClient()` from `lib/supabase/admin`, `'server-only'`): bypasses RLS. Only for signup provisioning (`auth.admin.createUser` w/ `app_metadata.role`) and admin email-stitching in `getEnrollmentsForAdmin`. Never expose key.

### 4.2 Rendering matrix
- Public pages: Server Components, `export const revalidate = 3600` (ISR), `[slug]` pages add `generateStaticParams`.
- Admin lists/edit + registrations: `export const dynamic = 'force-dynamic'` (required — public-client reads would otherwise prerender stale data at build).
- Mutations call `revalidatePath('/blog', ...)` etc.; clients also `router.refresh()` after actions.
- NO `loading.tsx`/`error.tsx` files exist anywhere — loading = Skeletons inside client layouts; errors = single class-based `AccessibleErrorBoundary` in root layout.

### 4.3 Security model — 4 layers (defense in depth)
```
Layer 1: src/proxy.ts (matcher: /admin/*, /dashboard/*, /login, /signup)
         → lib/supabase/middleware.ts updateSession():
           refreshes cookies both ways + supabase.auth.getClaims()
           (NEVER getSession() — getClaims validates JWT signature),
           reads claims.app_metadata.role:
           /admin/* requires 'admin', /dashboard/* requires 'student'
           → else redirect /login?redirect=<pathname>
Layer 2: Client layout gates (admin/layout.tsx, dashboard/layout.tsx via useAuth) — documented fallback only
Layer 3: Every privileged Server Action independently calls isAdminRequest()/studentUserId()
         (auth-guard.ts, JWT-revalidating getUser())
Layer 4: Postgres RLS (public.is_admin()/is_student() reading JWT app_metadata)
```
- Role comes EXCLUSIVELY from `app_metadata.role` (`'admin'|'student'`). `user_metadata` is never trusted (user-editable).
- AuthProvider signs out sessions without a recognized role; login routes admin→`/admin`, student→`/dashboard`.

### 4.4 Data flow pattern
Server page fetches via `cms-store` → passes ALL languages as props → client component picks `field[language]` via `useLanguage()`. No Redux/Zustand; only two React contexts (language, auth) + local useState. Components NEVER import cms-store directly — always through `app/actions/*`.

### 4.5 i18n mechanism
- `Language = 'en'|'de'|'fa'`; `LocalizedString = {en,de,fa}`; arrays (tags/objectives/prerequisites) are positional triples aligned across languages.
- Per-component inline dictionaries: `const t = { en:{...}, de:{...}, fa:{...} }` picked with `[language]`. No central dictionary, no i18n library.
- `useEffect` sets `document.documentElement.lang/dir` ('rtl' only for fa). RTL handled via Tailwind `rtl:` variants.
- date-fns locale via `getValidLocale()` (fa→faIR, de→de, en→enUS).

## 5. Database Schema (Postgres 17, Supabase)

9 tables, JSONB localized columns, RLS enabled on everything. Helper fns `public.is_admin()` / `public.is_student()` read `auth.jwt()->'app_metadata'->>'role'` (SECURITY INVOKER, `search_path=''` pinned). Policies are split PER-COMMAND (never `FOR ALL`) to avoid duplicate-permissive-policy advisor warnings.

| Table | PK | Key columns | RLS model |
|---|---|---|---|
| `site_content` | `key` text CHECK in (home/about/contact) | `content jsonb`, updated_at | public read; admin CUD |
| `posts` | `slug` text | title/excerpt/content/tags/seo jsonb, category CHECK(language/culture/tips), author, date, image_url/hint, idx date DESC | public read; admin CUD |
| `classes` | `slug` text | title/excerpt/description jsonb, type CHECK(private/group/workshop), level CHECK(a1..c2), status CHECK(active/full/inactive), objectives/prerequisites jsonb[], schedule jsonb{days,time}, price numeric?, max_students int?, seo jsonb | public read; admin CUD |
| `timeline_events` | uuid | year text, title/description jsonb, sort_order int (idx), positional ordering | public read; admin CUD |
| `class_registrations` | uuid | LEGACY guest leads; name/email/phone/class_name/class_slug/german_level/learning_goal/motivation | public INSERT only; admin read/delete; NO update |
| `contact_messages` | uuid | name/email/subject/message, submitted_at | public INSERT; admin read/delete |
| `page_views` | bigint identity | path, viewed_at, ip, user_agent, referrer | public INSERT; admin read; NO delete (append-only) |
| `profiles` | uuid FK→auth.users CASCADE | name, phone, german_level? | owner read/insert/update; admin read/delete |
| `enrollments` | uuid | user_id FK, class_slug FK→classes CASCADE, status CHECK(pending/approved/rejected/cancelled) DEFAULT pending, learning_goal?, motivation?, submitted_at, decided_at?, UNIQUE(user_id,class_slug) | owner read; owner INSERT only status='pending'; single UPDATE policy: USING(admin OR owner) WITH CHECK(admin OR owner AND new status in pending/cancelled) → students can't self-approve; admin delete |

- Explicit REVOKE-then-GRANT in migrations (legacy Supabase auto-grants incl. TRUNCATE existed). anon: select content tables + insert submissions/analytics only. profiles/enrollments not granted to anon at all.
- `savePosts`/`saveClasses`: upsert-all + delete-missing diff sync. `saveTimeline`: delete-all + re-insert positional. `insertEnrollment`: upsert onConflict `user_id,class_slug` → re-enroll flips same row back to pending.

### Enrollment business logic (in `enrollment-actions.ts`)
- Approve blocked when approved-count ≥ maxStudents; last seat approves → class active→full; reject on full class → full→active; manually-inactive classes never auto-toggle. Decisions set decided_at; each revalidates `/admin/registrations`, `/dashboard`, `/classes`, `/classes/{slug}`.
- Signup (`signUpStudent`): service-role createUser(email_confirm:true, role student) → upsert profile → **rollback deletes auth user if profile insert fails**. Returns stable message keys (invalid_input/signup_failed) mapped client-side.

## 6. Key Files Quick Reference

| Task | File |
|---|---|
| Change global SEO/title | `src/app/layout.tsx` (only real Metadata export) |
| Add/rename route | `src/app/(main)/...` or `src/app/admin/...` |
| New DB query | `src/lib/cms-store.ts` (+ mapper in `lib/supabase/mappers.ts` if new table) |
| New mutation | Server Action in `src/app/actions/*` + gate via `isAdminRequest()`/`studentUserId()` + `revalidatePath` |
| Auth rule change | `src/lib/supabase/middleware.ts` + `auth-guard.ts` + RLS migration (all three must agree) |
| Theme/colors | `src/app/globals.css` HSL tokens + `tailwind.config.ts` |
| Seed DB | `node scripts/seed.mjs` (needs env; creates admin user too) |
| Security test | `node scripts/rls-probe.mjs` |

## 7. Environment Variables (`.env.example` is authoritative)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | project URL (browser-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key (RLS is the boundary) |
| `SUPABASE_SERVICE_ROLE_KEY` | SERVER ONLY, bypasses RLS (admin.ts, seed.mjs, rls-probe fixtures) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seed-only initial admin creds → provisioned by seed.mjs; changed later at /admin/settings/account |
| `SUPABASE_ACCESS_TOKEN` | Management API token (sbp_...) for apply-schema/advisors scripts; pass inline, never commit |

⚠️ `.env.local.example` is incomplete (missing Supabase vars). Hard-coded project ref `uptxnousjzidadoviavu` exists in apply-schema.mjs + advisors.mjs. No `.env*` committed (good). Test creds `admin@example.com/password` hardcoded in ≥7 test files.
⚠️ **Local signup requires `SUPABASE_SERVICE_ROLE_KEY` inside `.env.local`** — `signUpStudent` calls `auth.admin.createUser` via `createAdminClient()`, which throws without it, so browser-signup 500s locally while production (Vercel) works. Placeholder comment sits in `.env.local`; paste the dashboard key there and restart dev. Test students seeded directly into `auth.users`+`profiles`: `sara.test@example.com`, `lina.test@example.com` (password `Test1234!`, approved in free workshop).

## 8. Testing & CI

- **Commands:** `npm run dev` (**port 9002**, turbopack) · `build` · `lint` (eslint src CLI — Next16 removed `next lint`) · `typecheck` (tsc --noEmit) · `test:unit` (vitest) · `test:e2e` (playwright) · `analyze`.
- **Unit:** exactly 1 test (`tests/unit/utils.spec.ts` tests `cn()`). happy-dom env, setup file empty placeholder.
- **E2E:** `tests/e2e/admin.spec.ts` = login smoke (NOT run in CI!). `tests/e2e/admin-visual.spec.ts` = 18 tests (6 admin pages × 3 viewports 375/768/1280): screenshots + axe-core CDN 4.7.2 audits + focus-ring/icon-ARIA heuristics + RTL snapshots — **warn-only, non-failing artifacts** into `playwright-screenshots/`, `playwright-reports/`.
- **Playwright config:** baseURL/webServer `http://localhost:9002` (`npm run dev`, reuseExistingServer:true, 120s timeout), chromium only, fullyParallel:false. (Historical bug: webServer block must live inside defineConfig.)
- **CI** (`.github/workflows/ci.yml`, push/PR → main/master): Node 20, npm ci, playwright install --with-deps, typecheck, unit, background `npm run dev` + wait-on :9002, run ONLY admin-visual.spec, `node scripts/parse-axe-reports.js`, upload artifacts. **Gaps:** no lint step, no production build check, axe non-blocking, no caching, lighthouse script points at wrong port (3000 vs 9002).
- Console suites in `tests/*.js` are byte-identical duplicates of `public/*.js` (static serving for browser DevTools workflow + test-runner.html launcher). Manual QA checklist: `tests/manual-test-checklist.md` (Persian).

## 9. Design System

- Palette (HSL vars in globals.css): Light bg = Parchment Cream `35 43% 94%`, primary = Burnt Terracotta DARKENED to `19 48% 37%` (blueprint said #B85C38; darkened for WCAG contrast — intentional divergence), accent olive `98 8% 36%`. Dark mode = inverted contrast same hues (bg `20 14% 4%`).
- Radius 0.5rem; accordion-down/up keyframes only custom animations; typography plugin restyles headings (headline font) + blockquotes.
- RTL overrides for sheet/sidebar sides in globals.css `[dir="rtl"]` block.

## 10. Known Quirks / Gotchas / Tech Debt

1. **Dead code:** `framer-motion` dep unused; `components/layout/metadata.tsx` uses `next/head` (Pages Router API — does NOTHING in App Router, yet imported by contact-page-content); `lib/seo.ts` unused w/ placeholder verification codes/fake phone; `language-context-wrapper.tsx` unconsumed.
2. **No per-page SEO:** despite rich per-language `seo` fields stored in DB, no `generateMetadata` anywhere except root. Blog posts/classes don't emit titles/OG.
3. **Legacy vs current systems coexist:** `class_registrations` (guest leads, deprecated actions marked do-not-wire) + `contact_messages` alongside Phase-1 `profiles`/`enrollments`.
4. **Analytics scalability:** `getAnalyticsData` loads up to 50k `page_views` rows and aggregates in JS memory; raw IP/UA stored (privacy/GDPR unaddressed). Comment suggests SQL RPC migration path.
5. **Toast quirk:** TOAST_REMOVE_DELAY=1000000ms (~16.7min), limit 1 — stock shadcn defaults, effectively manual dismissal.
6. **Stale docs/scripts:** tests/README says Next 15.3.3 (actual 16.1.1); bundle-analysis.ps1 hardcodes path to different project ("MARYAM WEB"); supabase/config.toml references missing `supabase/seed.sql`.
7. **Unchecked casts:** `getSiteContent` does `data.content as T` (JSONB shape trusted); blog post body rendered via `dangerouslySetInnerHTML` (admin-authored content only).
8. **English-only leftovers:** admin sidebar labels/messages-table chrome/deploy CodeBlock buttons stay English regardless of locale; zod error messages English-only.
9. **Seed image URLs:** some Unsplash URLs in empty-data.ts contain malformed spaces in ixid params.
10. **Root html lang="en"** until client hydration flips to fa/RTL (suppressHydrationWarning set).
11. `/admin/content` has NO index page — only edit/[slug], reachable from settings links.
12. Hero CTA links hardcode `/classes/free-mitreden-workshop`; hero images hardcoded.

## 11. Deployment Setup (LIVE as of 2026-08-22)

- **Official brand:** **Fluentia** (confirmed by owner). Domain owned by user: **`fluentiaa.ir`** (note: TWO a's). Legacy "LinguaSage"/linguasage.com references are dead legacy — safe to replace when doing brand cleanup.
- **Vercel:** team `emads-projects-41cb6447`, project **`maryam-portfolio-1`** (`prj_3n9GyqcWLfzOq3QTUJn8q2uh9y6b`), git-linked to `github.com/Emad211/MARYAM_PORTFOLIO1` (main → production auto-deploy).
- **Domains on project:** `fluentiaa.ir` (apex) + `www.fluentiaa.ir` (308 → apex).
- **Supabase project (prod):** ref `uptxnousjzidadoviavu`, name "maryam portfolio", region ap-southeast-1, schema applied + seeded (3/3/3/5 rows, 2 auth users).
- **Vercel env vars (all targets):** `NEXT_PUBLIC_SUPABASE_URL=https://uptxnousjzidadoviavu.supabase.co`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=<legacy anon JWT>`. Also present: `SUPABASE_SERVICE_ROLE_KEY` (production only), `RESEND_API_KEY`, `RESEND_EMAIL_DOMAIN`.
- **Supabase Auth config:** `site_url=https://fluentiaa.ir`; `uri_allow_list=https://fluentiaa.ir/**,https://www.fluentiaa.ir/**,https://maryam-portfolio-1*.vercel.app/**,http://localhost:9002/**`.
- **DNS status:** domain NS = Cloudflare (igor/lila.ns.cloudflare.com); A/CNAME records toward Vercel may still be missing at registrar — if site unreachable, user must add in Cloudflare: `A @ → 76.76.21.21` and `CNAME www → cname.vercel-dns.com`, both **DNS-only** (no CF proxy).

## 12. Git History Context (15 commits)

Rapid modernization arc: Next15 prod-ready → CI+a11y fixes → gitignore hygiene → ESLint `any` cleanup → **Supabase migration (from Vercel Blob + homemade auth)** → Next 16.1.1 security patch (CVE-2025-66478) → middleware→proxy rename → account-based enrollment loop w/ manual approval → ISR perf work. Working tree currently clean on main.

---

## Working Conventions For Agents

- Verify changes: `npm run typecheck && npm run lint && npm run test:unit`. E2E needs dev server on port 9002.
- Never trust `user_metadata` for authorization; never bypass the 3-client pattern; never add a read through request-bound client to an ISR page.
- Match existing patterns: inline trilingual dictionaries, `as const` typing, conditional-spread optional fields (because `exactOptionalPropertyTypes`), message-key-based action errors mapped to localized toasts client-side.
- Migrations: idempotent SQL, revoke-then-grant, per-command policies, drop old policy names defensively.
