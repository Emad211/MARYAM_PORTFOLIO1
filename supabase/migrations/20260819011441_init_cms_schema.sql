-- ============================================================================
-- MARYAM WEB / Fluentia — initial Supabase schema
-- Trilingual CMS (en/de/fa). Localized text fields are JSONB {en,de,fa}.
-- All tables live in `public` with RLS enabled and least-privilege GRANTs.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Authorization helper: is the current request an authenticated admin?
-- Reads role from app_metadata (server-controlled), NOT user_metadata
-- (user_metadata is user-editable and unsafe for authz).
-- SECURITY INVOKER: only reads the caller's own JWT, bypasses nothing.
-- search_path pinned to '' to prevent search_path hijacking.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ===========================================================================
-- site_content — three singletons (home / about / contact) as JSONB rows
-- ===========================================================================
create table if not exists public.site_content (
  key        text primary key check (key in ('home', 'about', 'contact')),
  content    jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;

drop policy if exists "site_content public read" on public.site_content;
create policy "site_content public read"
  on public.site_content for select
  to anon, authenticated
  using (true);

-- Writes are admin-only. Split per-command (not FOR ALL) so SELECT for the
-- authenticated role is served solely by the public-read policy above,
-- avoiding duplicate permissive SELECT policies.
drop policy if exists "site_content admin insert" on public.site_content;
create policy "site_content admin insert"
  on public.site_content for insert
  to authenticated
  with check (public.is_admin());
drop policy if exists "site_content admin update" on public.site_content;
create policy "site_content admin update"
  on public.site_content for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "site_content admin delete" on public.site_content;
create policy "site_content admin delete"
  on public.site_content for delete
  to authenticated
  using (public.is_admin());

-- ===========================================================================
-- posts
-- ===========================================================================
create table if not exists public.posts (
  slug        text primary key,
  title       jsonb not null,
  excerpt     jsonb not null,
  content     jsonb not null,
  author      text  not null default '',
  date        timestamptz not null default now(),
  category    text  not null check (category in ('language', 'culture', 'tips')),
  image_url   text  not null default '',
  image_hint  text  not null default '',
  tags        jsonb not null default '[]'::jsonb,
  seo         jsonb not null,
  created_at  timestamptz not null default now()
);
alter table public.posts enable row level security;
create index if not exists posts_date_idx on public.posts (date desc);

drop policy if exists "posts public read" on public.posts;
create policy "posts public read"
  on public.posts for select
  to anon, authenticated
  using (true);

drop policy if exists "posts admin insert" on public.posts;
create policy "posts admin insert"
  on public.posts for insert
  to authenticated
  with check (public.is_admin());
drop policy if exists "posts admin update" on public.posts;
create policy "posts admin update"
  on public.posts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "posts admin delete" on public.posts;
create policy "posts admin delete"
  on public.posts for delete
  to authenticated
  using (public.is_admin());

-- ===========================================================================
-- classes
-- ===========================================================================
create table if not exists public.classes (
  slug          text primary key,
  title         jsonb not null,
  excerpt       jsonb not null,
  description   jsonb not null,
  type          text  not null check (type in ('private', 'group', 'workshop')),
  level         text  not null check (level in ('a1', 'a2', 'b1', 'b2', 'c1', 'c2')),
  status        text  not null check (status in ('active', 'full', 'inactive')),
  objectives    jsonb not null default '[]'::jsonb,
  prerequisites jsonb not null default '[]'::jsonb,
  image_url     text  not null default '',
  image_hint    text  not null default '',
  schedule      jsonb not null,
  price         numeric,
  max_students  integer,
  seo           jsonb not null,
  created_at    timestamptz not null default now()
);
alter table public.classes enable row level security;

drop policy if exists "classes public read" on public.classes;
create policy "classes public read"
  on public.classes for select
  to anon, authenticated
  using (true);

drop policy if exists "classes admin insert" on public.classes;
create policy "classes admin insert"
  on public.classes for insert
  to authenticated
  with check (public.is_admin());
drop policy if exists "classes admin update" on public.classes;
create policy "classes admin update"
  on public.classes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "classes admin delete" on public.classes;
create policy "classes admin delete"
  on public.classes for delete
  to authenticated
  using (public.is_admin());

-- ===========================================================================
-- timeline_events (no natural key in the TS type; ordered by sort_order)
-- ===========================================================================
create table if not exists public.timeline_events (
  id          uuid primary key default gen_random_uuid(),
  year        text  not null,
  title       jsonb not null,
  description jsonb not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.timeline_events enable row level security;
create index if not exists timeline_events_sort_idx on public.timeline_events (sort_order);

drop policy if exists "timeline public read" on public.timeline_events;
create policy "timeline public read"
  on public.timeline_events for select
  to anon, authenticated
  using (true);

drop policy if exists "timeline admin insert" on public.timeline_events;
create policy "timeline admin insert"
  on public.timeline_events for insert
  to authenticated
  with check (public.is_admin());
drop policy if exists "timeline admin update" on public.timeline_events;
create policy "timeline admin update"
  on public.timeline_events for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "timeline admin delete" on public.timeline_events;
create policy "timeline admin delete"
  on public.timeline_events for delete
  to authenticated
  using (public.is_admin());

-- ===========================================================================
-- class_registrations — public INSERT, admin read/delete
-- ===========================================================================
create table if not exists public.class_registrations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  phone         text not null default '',
  class_name    text not null default '',
  class_slug    text not null default '',
  submitted_at  timestamptz not null default now(),
  german_level  text,
  learning_goal text,
  motivation    text
);
alter table public.class_registrations enable row level security;
create index if not exists class_registrations_slug_idx on public.class_registrations (class_slug);
create index if not exists class_registrations_submitted_idx on public.class_registrations (submitted_at desc);

drop policy if exists "registrations public insert" on public.class_registrations;
create policy "registrations public insert"
  on public.class_registrations for insert
  to anon, authenticated
  with check (true);

drop policy if exists "registrations admin read" on public.class_registrations;
create policy "registrations admin read"
  on public.class_registrations for select
  to authenticated
  using (public.is_admin());

drop policy if exists "registrations admin delete" on public.class_registrations;
create policy "registrations admin delete"
  on public.class_registrations for delete
  to authenticated
  using (public.is_admin());

-- ===========================================================================
-- contact_messages — public INSERT, admin read/delete
-- ===========================================================================
create table if not exists public.contact_messages (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  subject      text not null default '',
  message      text not null,
  submitted_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create index if not exists contact_messages_submitted_idx on public.contact_messages (submitted_at desc);

drop policy if exists "messages public insert" on public.contact_messages;
create policy "messages public insert"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "messages admin read" on public.contact_messages;
create policy "messages admin read"
  on public.contact_messages for select
  to authenticated
  using (public.is_admin());

drop policy if exists "messages admin delete" on public.contact_messages;
create policy "messages admin delete"
  on public.contact_messages for delete
  to authenticated
  using (public.is_admin());

-- ===========================================================================
-- page_views — public INSERT (analytics log), admin read
-- ===========================================================================
create table if not exists public.page_views (
  id         bigint generated always as identity primary key,
  path       text not null,
  viewed_at  timestamptz not null default now(),
  ip         text not null default 'unknown',
  user_agent text not null default 'unknown',
  referrer   text
);
alter table public.page_views enable row level security;
create index if not exists page_views_viewed_at_idx on public.page_views (viewed_at desc);
create index if not exists page_views_path_idx on public.page_views (path);

drop policy if exists "page_views public insert" on public.page_views;
create policy "page_views public insert"
  on public.page_views for insert
  to anon, authenticated
  with check (true);

drop policy if exists "page_views admin read" on public.page_views;
create policy "page_views admin read"
  on public.page_views for select
  to authenticated
  using (public.is_admin());

-- ===========================================================================
-- Explicit privilege grants (least privilege).
--
-- This remote project still carries Supabase's LEGACY default privileges,
-- which auto-grant ALL to anon/authenticated on every new public table at
-- CREATE time. RLS still gates rows, but holding write/TRUNCATE privileges on
-- anon violates least-privilege (and TRUNCATE bypasses RLS entirely). So we
-- first REVOKE everything from the Data API roles, then grant back only what
-- each role actually needs. service_role (server-only, bypasses RLS) keeps
-- full access for seeding/admin scripts.
-- ===========================================================================

revoke all on public.site_content, public.posts, public.classes, public.timeline_events,
               public.class_registrations, public.contact_messages, public.page_views
  from anon, authenticated;

-- anon (public visitors): read published content; submit forms & analytics only.
grant select on public.site_content, public.posts, public.classes, public.timeline_events to anon;
grant insert on public.class_registrations, public.contact_messages, public.page_views to anon;

-- authenticated (the logged-in admin): read everything; manage content;
-- submit/read analytics; delete submissions. RLS additionally restricts the
-- content-management and submission-reading rows to is_admin().
grant select on public.site_content, public.posts, public.classes, public.timeline_events,
                public.class_registrations, public.contact_messages, public.page_views to authenticated;
grant insert, update, delete on public.site_content, public.posts, public.classes, public.timeline_events to authenticated;
grant insert, delete on public.class_registrations, public.contact_messages to authenticated;
grant insert on public.page_views to authenticated;

-- timeline_events uses a uuid default (no sequence); page_views identity
-- sequence is owned by the table, so INSERT covers it — no sequence grants.

-- service_role: full access (server-side only; bypasses RLS).
grant all on public.site_content, public.posts, public.classes, public.timeline_events,
              public.class_registrations, public.contact_messages, public.page_views
  to service_role;
