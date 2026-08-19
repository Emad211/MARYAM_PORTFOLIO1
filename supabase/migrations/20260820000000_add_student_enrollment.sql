-- ============================================================================
-- MARYAM WEB / Fluentia — student accounts + real enrollment (Phase 1)
--
-- Adds a second role ('student') alongside 'admin', a profiles table (one row
-- per auth user), and an enrollments table with a manual-approval lifecycle
-- (pending -> approved / rejected, or student-cancelled).
--
-- This introduces the FIRST owner-scoped RLS in this schema: rows are visible
-- and writable by their owning user (auth.uid() = user_id) OR by an admin.
-- auth.uid() is wrapped in a subselect so it is evaluated once per statement,
-- not once per row. Same conventions as the init migration: per-command
-- policies (never FOR ALL), explicit TO clause, revoke-then-least-privilege
-- grants (this project carries Supabase's legacy auto-grant defaults).
-- Idempotent — safe to run repeatedly.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Authorization helper: is the current request an authenticated student?
-- Mirrors public.is_admin(): reads role from app_metadata (server-controlled),
-- SECURITY INVOKER, search_path pinned to ''.
-- ---------------------------------------------------------------------------
create or replace function public.is_student()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'student',
    false
  );
$$;

-- ===========================================================================
-- profiles — one row per auth user. Owner reads/writes own row; admin reads all.
-- The email lives on auth.users; this table holds the app-level display fields.
-- ===========================================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  name         text not null default '',
  phone        text not null default '',
  german_level text,                        -- nullable CEFR (a1..c2), free text
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- SELECT: your own row, or any row if admin.
drop policy if exists "profiles owner read" on public.profiles;
create policy "profiles owner read"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id or public.is_admin());

-- INSERT: only your own row (signup provisions via service_role, but this lets
-- an authenticated user self-provision safely too).
drop policy if exists "profiles owner insert" on public.profiles;
create policy "profiles owner insert"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- UPDATE: only your own row; both USING and WITH CHECK (prevents re-targeting id).
drop policy if exists "profiles owner update" on public.profiles;
create policy "profiles owner update"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- DELETE: admin only (owner rows disappear via the auth.users cascade).
drop policy if exists "profiles admin delete" on public.profiles;
create policy "profiles admin delete"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- ===========================================================================
-- enrollments — student self-enrolls (forced 'pending'); admin decides status.
-- One row per (user, class); a re-enrol after cancel/reject flips the same row
-- back to 'pending' via upsert on the unique constraint.
-- ===========================================================================
create table if not exists public.enrollments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  class_slug    text not null references public.classes (slug) on delete cascade,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  learning_goal text,
  motivation    text,
  submitted_at  timestamptz not null default now(),
  decided_at    timestamptz,
  unique (user_id, class_slug)
);
alter table public.enrollments enable row level security;

-- Capacity COUNT filters by class_slug; the unique(user_id, class_slug) index
-- already serves the auth.uid() = user_id predicate (user_id is its leading col).
create index if not exists enrollments_class_slug_idx on public.enrollments (class_slug);
create index if not exists enrollments_submitted_idx  on public.enrollments (submitted_at desc);

-- SELECT: your own rows, or all rows if admin.
drop policy if exists "enrollments owner read" on public.enrollments;
create policy "enrollments owner read"
  on public.enrollments for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

-- INSERT: only your own row, and only status='pending'
-- (the WITH CHECK forbids self-inserting an 'approved' row).
drop policy if exists "enrollments owner insert" on public.enrollments;
create policy "enrollments owner insert"
  on public.enrollments for insert
  to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending');

-- UPDATE: a single permissive policy (this schema avoids duplicate permissive
-- policies — see the init migration). Admins may set any status on any row;
-- an owner (non-admin) may touch only their own row and may move it ONLY to
-- 'pending' or 'cancelled' — so a student cannot self-approve, and cannot edit
-- another user's row (IDOR). A student JWT never satisfies is_admin(), so the
-- admin disjunct is unreachable for them.
drop policy if exists "enrollments admin update" on public.enrollments;
drop policy if exists "enrollments owner update" on public.enrollments;
drop policy if exists "enrollments update" on public.enrollments;
create policy "enrollments update"
  on public.enrollments for update
  to authenticated
  using (
    public.is_admin()
    or (select auth.uid()) = user_id
  )
  with check (
    public.is_admin()
    or ((select auth.uid()) = user_id and status in ('pending', 'cancelled'))
  );

-- DELETE: admin only (students cancel via UPDATE -> 'cancelled').
drop policy if exists "enrollments admin delete" on public.enrollments;
create policy "enrollments admin delete"
  on public.enrollments for delete
  to authenticated
  using (public.is_admin());

-- ===========================================================================
-- Explicit privilege grants (least privilege) — see the init migration's note
-- on the project's legacy auto-grant defaults. NEW tables are otherwise left
-- with ALL granted to anon/authenticated at CREATE time, so revoke first.
--
-- Neither table is reachable by anon: enrolling and viewing require login.
-- RLS narrows the authenticated grants to own-rows / admin further.
-- ===========================================================================
revoke all on public.profiles, public.enrollments from anon, authenticated;

grant select, insert, update, delete on public.profiles   to authenticated;
grant select, insert, update, delete on public.enrollments to authenticated;

grant all on public.profiles, public.enrollments to service_role;
