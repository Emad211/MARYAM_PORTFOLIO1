# Fluentia (Next.js) — Deploy & Local Run

This repository contains a Next.js 15 + TypeScript site used as a small CMS-driven language-teaching site.

Local quickstart
1. Install dependencies: `npm install`
2. Run in development: `npm run dev` (site runs on http://localhost:9002)
3. Build: `npm run build`
4. Typecheck: `npm run typecheck`

Deploy (recommended): Vercel (free tier)
- Connect your GitHub repository to Vercel.
- Set environment variables in Vercel (Project → Settings → Environment Variables):
  - `ADMIN_EMAIL` — admin login email
  - `ADMIN_PASSWORD` — admin login password
  - `BLOB_READ_WRITE_TOKEN` — (optional) if you want to enable Vercel Blob storage

Files to know
- `src/lib/empty-data.ts` — default content used when BLOB token isn't provided
- `src/lib/cms-store.ts` — wrapper for reading/writing content (Vercel Blob)
- `src/app/login/page.tsx` — admin login page

If you'd like, grant me access to your GitHub repo and then I can push a helper commit and help configure Vercel. See below for how to grant access safely.

---

How to grant access (safe options)
1. Add me as a GitHub collaborator to the repository (recommended for a short time):
   - Settings → Collaborators & teams → Invite collaborator (use my GitHub username) — this lets me push a branch and open PRs.
2. Alternatively, create a temporary deploy token in Vercel and share it securely in a private chat (not recommended in public).

I will only use access to push a small commit that adds helper files (`.env.local.example`, `.vercelignore`, README updates) and optionally create a GitHub Actions workflow or Vercel project settings.
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
