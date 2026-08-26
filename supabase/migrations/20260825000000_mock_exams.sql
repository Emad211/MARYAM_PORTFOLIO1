-- Phase 3: mock exam simulator (objective sections: Lesen/Hören) + listening bank
-- mock_exams/mock_sections : exam blueprints as data
-- questions                : gains optional section ownership (XOR lesson),
--                            audio_path + plays_allowed (0 none / 1 once / 2 twice)
-- mock_sessions            : server-authoritative timer (expires_at fixed at start)
-- attempts                 : gains session_id so simulator results are queryable

create table if not exists public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title jsonb not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_sections (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.mock_exams(id) on delete cascade,
  section text not null check (section in ('lesen','hoeren')),
  duration_min integer not null check (duration_min between 1 and 240),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id uuid not null references public.mock_exams(id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress','completed','abandoned')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz
);

-- Multiple retakes are allowed by design; stale in_progress sessions are
-- abandoned by startMockSession before creating a fresh one.
drop index if exists idx_mock_sessions_user;
create index if not exists idx_mock_sessions_user on public.mock_sessions(user_id, status);

-- questions: allow exam-section ownership instead of lesson
alter table public.questions alter column lesson_id drop not null;
alter table public.questions add column if not exists section_id uuid
  references public.mock_sections(id) on delete cascade;
alter table public.questions add column if not exists audio_path text;
alter table public.questions add column if not exists plays_allowed integer
  not null default 0 check (plays_allowed in (0,1,2));

-- exactly one owner: lesson XOR section
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'questions_owner_xor'
  ) then
    alter table public.questions
      add constraint questions_owner_xor
      check (
        ((lesson_id is not null)::int + (section_id is not null)::int) = 1
      );
  end if;
end $$;

create index if not exists idx_questions_section on public.questions(section_id);

-- attempts: link to simulator session (practice stays NULL)
alter table public.attempts add column if not exists session_id uuid
  references public.mock_sessions(id) on delete set null;
create index if not exists idx_attempts_session on public.attempts(session_id);

-- ------------------------------------------------------------------
-- SECURITY DEFINER: batched, time-guarded section submission
-- ------------------------------------------------------------------
create or replace function public.submit_section_answers(
  p_session_id uuid,
  p_answers jsonb   -- [{"question_id":"...", "answer":{...}}, ...]
)
returns jsonb       -- [{"question_id":"...", "is_correct": bool}, ...]
language plpgsql
security definer
set search_path = ''
volatile
as $$
declare
  v_user uuid := auth.uid();
  v_session public.mock_sessions;
  v_q record;
  v_ok boolean;
  v_item jsonb;
  v_result jsonb := '[]'::jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_session from public.mock_sessions
    where id = p_session_id and user_id = v_user;

  if v_session.id is null then
    raise exception 'session_not_found';
  end if;
  if v_session.status <> 'in_progress' then
    raise exception 'session_closed';
  end if;
  -- 30s network grace beyond the server deadline
  if now() > v_session.expires_at + interval '30 seconds' then
    raise exception 'session_expired';
  end if;

  for v_item in select * from jsonb_array_elements(p_answers)
  loop
    select q.id, q.answer_key, ms.exam_id
      into v_q
      from public.questions q
      join public.mock_sections ms on ms.id = q.section_id
      where q.id = (v_item->>'question_id')::uuid;

    if v_q.id is null then
      continue; -- unknown question: skip silently (defensive)
    end if;
    if v_q.exam_id <> v_session.exam_id then
      continue; -- question from another exam: skip
    end if;

    v_ok := (v_q.answer_key = (v_item->'answer'));

    -- idempotency: one attempt per (session, question)
    if exists (
      select 1 from public.attempts
        where session_id = p_session_id
          and question_id = v_q.id
          and user_id = v_user
    ) then
      continue;
    end if;

    insert into public.attempts (user_id, question_id, answer, is_correct, session_id)
    values (v_user, v_q.id, v_item->'answer', v_ok, p_session_id);

    v_result := v_result || jsonb_build_array(
      jsonb_build_object('question_id', v_q.id, 'is_correct', v_ok)
    );
  end loop;

  return v_result;
end;
$$;

revoke all on function public.submit_section_answers(uuid, jsonb) from public, anon;
grant execute on function public.submit_section_answers(uuid, jsonb) to authenticated;

-- ------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------
alter table public.mock_exams enable row level security;
alter table public.mock_sections enable row level security;
alter table public.mock_sessions enable row level security;

drop policy if exists "mock_exams_public_read" on public.mock_exams;
create policy "mock_exams_public_read" on public.mock_exams for select
  to anon, authenticated using (true);
drop policy if exists "mock_exams_admin_insert" on public.mock_exams;
create policy "mock_exams_admin_insert" on public.mock_exams for insert
  to authenticated with check (public.is_admin());
drop policy if exists "mock_exams_admin_update" on public.mock_exams;
create policy "mock_exams_admin_update" on public.mock_exams for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mock_exams_admin_delete" on public.mock_exams;
create policy "mock_exams_admin_delete" on public.mock_exams for delete
  to authenticated using (public.is_admin());

drop policy if exists "mock_sections_public_read" on public.mock_sections;
create policy "mock_sections_public_read" on public.mock_sections for select
  to anon, authenticated using (true);
drop policy if exists "mock_sections_admin_insert" on public.mock_sections;
create policy "mock_sections_admin_insert" on public.mock_sections for insert
  to authenticated with check (public.is_admin());
drop policy if exists "mock_sections_admin_update" on public.mock_sections;
create policy "mock_sections_admin_update" on public.mock_sections for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mock_sections_admin_delete" on public.mock_sections;
create policy "mock_sections_admin_delete" on public.mock_sections for delete
  to authenticated using (public.is_admin());

-- sessions: owner creates/reads; owner may only finalize (completed/abandoned);
-- scoring writes happen inside the definer function.
drop policy if exists "mock_sessions_owner_select" on public.mock_sessions;
create policy "mock_sessions_owner_select" on public.mock_sessions for select
  to authenticated using (user_id = auth.uid());
drop policy if exists "mock_sessions_owner_insert" on public.mock_sessions;
create policy "mock_sessions_owner_insert" on public.mock_sessions for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'in_progress');
drop policy if exists "mock_sessions_owner_finalize" on public.mock_sessions;
create policy "mock_sessions_owner_finalize" on public.mock_sessions for update
  to authenticated
  using (user_id = auth.uid() and status = 'in_progress')
  with check (
    user_id = auth.uid()
    and status in ('completed','abandoned')
  );
drop policy if exists "mock_sessions_admin_select" on public.mock_sessions;
create policy "mock_sessions_admin_select" on public.mock_sessions for select
  to authenticated using (public.is_admin());

-- grants
revoke all on public.mock_exams from anon, authenticated;
revoke all on public.mock_sections from anon, authenticated;
revoke all on public.mock_sessions from anon, authenticated;
grant select on public.mock_exams to anon, authenticated;
grant select on public.mock_sections to anon, authenticated;
grant insert, update, delete on public.mock_exams to authenticated;    -- RLS->admin
grant insert, update, delete on public.mock_sections to authenticated; -- RLS->admin
grant select, insert, update on public.mock_sessions to authenticated;

-- ------------------------------------------------------------------
-- Storage: PUBLIC 'listening' bucket — admin-managed audio bank
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listening', 'listening', true, 15728640,
  array['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/ogg','audio/webm']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "listening_public_read" on storage.objects;
create policy "listening_public_read" on storage.objects for select
  to anon, authenticated using (bucket_id = 'listening');

drop policy if exists "listening_admin_write" on storage.objects;
create policy "listening_admin_write" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listening' and public.is_admin());

drop policy if exists "listening_admin_update" on storage.objects;
create policy "listening_admin_update" on storage.objects for update
  to authenticated
  using (bucket_id = 'listening' and public.is_admin())
  with check (bucket_id = 'listening' and public.is_admin());

drop policy if exists "listening_admin_delete" on storage.objects;
create policy "listening_admin_delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'listening' and public.is_admin());
