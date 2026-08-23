-- LMS core: modules, lessons, questions, attempts, lesson_progress
-- Security model:
--   * questions table = admin-only via RLS (holds answer keys).
--   * Students NEVER read questions directly. They go through two
--     SECURITY DEFINER functions:
--       get_lesson_exercises(lesson_id) -> rows WITHOUT answer_key
--       grade_attempt(question_id, answer) -> grades internally, logs attempt,
--         returns boolean only. Brute-forcing yields nothing beyond guessing.
-- House rules: defensive drops, per-command policies, pinned search_path,
-- revoke-then-grant.

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  class_slug text not null references public.classes(slug) on delete cascade,
  title jsonb not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title jsonb not null,
  body jsonb not null,
  video_url text,
  skill text not null default 'allgemein'
    check (skill in ('lesen','hoeren','schreiben','sprechen','allgemein')),
  duration_min integer,
  is_free_preview boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  type text not null check (type in ('mc','match','jnl')),
  prompt jsonb not null,
  payload jsonb not null default '{}'::jsonb,
  answer_key jsonb not null,
  points integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer jsonb not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists idx_modules_class on public.modules(class_slug);
create index if not exists idx_lessons_module on public.lessons(module_id);
create index if not exists idx_questions_lesson on public.questions(lesson_id);
create index if not exists idx_attempts_user on public.attempts(user_id);
create index if not exists idx_attempts_question on public.attempts(question_id);

alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.lesson_progress enable row level security;

-- modules: public read, admin write
drop policy if exists "modules_public_read" on public.modules;
create policy "modules_public_read" on public.modules for select
  to anon, authenticated using (true);
drop policy if exists "modules_admin_insert" on public.modules;
create policy "modules_admin_insert" on public.modules for insert
  to authenticated with check (public.is_admin());
drop policy if exists "modules_admin_update" on public.modules;
create policy "modules_admin_update" on public.modules for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "modules_admin_delete" on public.modules;
create policy "modules_admin_delete" on public.modules for delete
  to authenticated using (public.is_admin());

-- lessons: public read, admin write
drop policy if exists "lessons_public_read" on public.lessons;
create policy "lessons_public_read" on public.lessons for select
  to anon, authenticated using (true);
drop policy if exists "lessons_admin_insert" on public.lessons;
create policy "lessons_admin_insert" on public.lessons for insert
  to authenticated with check (public.is_admin());
drop policy if exists "lessons_admin_update" on public.lessons;
create policy "lessons_admin_update" on public.lessons for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "lessons_admin_delete" on public.lessons;
create policy "lessons_admin_delete" on public.lessons for delete
  to authenticated using (public.is_admin());

-- questions: ADMIN ONLY (no public/authenticated select policy -> denied)
drop policy if exists "questions_admin_select" on public.questions;
create policy "questions_admin_select" on public.questions for select
  to authenticated using (public.is_admin());
drop policy if exists "questions_admin_insert" on public.questions;
create policy "questions_admin_insert" on public.questions for insert
  to authenticated with check (public.is_admin());
drop policy if exists "questions_admin_update" on public.questions;
create policy "questions_admin_update" on public.questions for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "questions_admin_delete" on public.questions;
create policy "questions_admin_delete" on public.questions for delete
  to authenticated using (public.is_admin());

-- attempts: owner insert/read, admin read/cleanup
drop policy if exists "attempts_owner_select" on public.attempts;
create policy "attempts_owner_select" on public.attempts for select
  to authenticated using (user_id = auth.uid());
drop policy if exists "attempts_owner_insert" on public.attempts;
create policy "attempts_owner_insert" on public.attempts for insert
  to authenticated with check (user_id = auth.uid());
drop policy if exists "attempts_admin_select" on public.attempts;
create policy "attempts_admin_select" on public.attempts for select
  to authenticated using (public.is_admin());
drop policy if exists "attempts_admin_delete" on public.attempts;
create policy "attempts_admin_delete" on public.attempts for delete
  to authenticated using (public.is_admin());

-- lesson_progress: owner crud, admin read
drop policy if exists "lp_owner_select" on public.lesson_progress;
create policy "lp_owner_select" on public.lesson_progress for select
  to authenticated using (user_id = auth.uid());
drop policy if exists "lp_owner_insert" on public.lesson_progress;
create policy "lp_owner_insert" on public.lesson_progress for insert
  to authenticated with check (user_id = auth.uid());
drop policy if exists "lp_owner_update" on public.lesson_progress;
create policy "lp_owner_update" on public.lesson_progress for update
  to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());
drop policy if exists "lp_owner_delete" on public.lesson_progress;
create policy "lp_owner_delete" on public.lesson_progress for delete
  to authenticated using (user_id = auth.uid());
drop policy if exists "lp_admin_select" on public.lesson_progress;
create policy "lp_admin_select" on public.lesson_progress for select
  to authenticated using (public.is_admin());

-- Grants (explicit, minimal)
revoke all on public.modules from anon, authenticated;
revoke all on public.lessons from anon, authenticated;
revoke all on public.questions from anon, authenticated;
revoke all on public.attempts from anon, authenticated;
revoke all on public.lesson_progress from anon, authenticated;

grant select on public.modules to anon, authenticated;
grant select on public.lessons to anon, authenticated;
grant insert, update, delete on public.modules to authenticated;
grant insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.questions to authenticated; -- RLS limits to admin rows
grant select, insert on public.attempts to authenticated;
grant delete on public.attempts to authenticated; -- admin cleanup path
grant select, insert, update, delete on public.lesson_progress to authenticated;

-- ------------------------------------------------------------------
-- SECURITY DEFINER bridge functions (the ONLY student access to questions)
-- ------------------------------------------------------------------

create or replace function public.get_lesson_exercises(p_lesson_id uuid)
returns table (
  id uuid,
  type text,
  prompt jsonb,
  payload jsonb,
  points integer,
  sort_order integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select q.id, q.type, q.prompt, q.payload, q.points, q.sort_order
  from public.questions q
  where q.lesson_id = p_lesson_id
  order by q.sort_order asc;
$$;

create or replace function public.grade_attempt(p_question_id uuid, p_answer jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
volatile
as $$
declare
  v_key jsonb;
  v_ok boolean := false;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select q.answer_key into v_key
  from public.questions q
  where q.id = p_question_id;

  if v_key is null then
    return false;
  end if;

  -- Shapes are normalized at write time: mc/jnl => {"correct": "<id>"};
  -- match => {"mapping": {"<leftId>": "<rightId>"}}. jsonb equality is
  -- semantic (key order irrelevant).
  v_ok := (v_key = p_answer);

  insert into public.attempts (user_id, question_id, answer, is_correct)
  values (auth.uid(), p_question_id, p_answer, v_ok);

  return v_ok;
end;
$$;

revoke all on function public.get_lesson_exercises(uuid) from public, anon;
grant execute on function public.get_lesson_exercises(uuid) to authenticated;

revoke all on function public.grade_attempt(uuid, jsonb) from public, anon;
grant execute on function public.grade_attempt(uuid, jsonb) to authenticated;
