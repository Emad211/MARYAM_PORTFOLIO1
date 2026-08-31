-- Wave R1 (teacher ease): session notes, question explanations,
-- homework assignments, inline submission annotations.

alter table public.live_sessions
  add column if not exists notes text;

alter table public.questions
  add column if not exists explanation jsonb;

create table if not exists public.homework_assignments (
  id uuid primary key default gen_random_uuid(),
  class_slug text not null references public.classes(slug) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  due_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_homework_class on public.homework_assignments(class_slug, due_at);

create table if not exists public.submission_annotations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null check (end_offset >= start_offset),
  comment text not null check (length(comment) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists idx_annotations_submission on public.submission_annotations(submission_id);

alter table public.homework_assignments enable row level security;
alter table public.submission_annotations enable row level security;

-- homework: approved-enrolled students read own class homework; admin full
drop policy if exists "hw_enrolled_read" on public.homework_assignments;
create policy "hw_enrolled_read" on public.homework_assignments for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.user_id = auth.uid()
        and e.class_slug = homework_assignments.class_slug
        and e.status = 'approved'
    )
  );
drop policy if exists "hw_admin_insert" on public.homework_assignments;
create policy "hw_admin_insert" on public.homework_assignments for insert
  to authenticated with check (public.is_admin());
drop policy if exists "hw_admin_delete" on public.homework_assignments;
create policy "hw_admin_delete" on public.homework_assignments for delete
  to authenticated using (public.is_admin());

-- annotations: admin writes; owner-of-submission or admin reads
drop policy if exists "annot_read" on public.submission_annotations;
create policy "annot_read" on public.submission_annotations for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.submissions s
      where s.id = submission_annotations.submission_id
        and s.user_id = auth.uid()
    )
  );
drop policy if exists "annot_admin_insert" on public.submission_annotations;
create policy "annot_admin_insert" on public.submission_annotations for insert
  to authenticated with check (public.is_admin());
drop policy if exists "annot_admin_delete" on public.submission_annotations;
create policy "annot_admin_delete" on public.submission_annotations for delete
  to authenticated using (public.is_admin());

revoke all on public.homework_assignments from anon, authenticated;
revoke all on public.submission_annotations from anon, authenticated;
grant select on public.homework_assignments to authenticated;
grant insert, delete on public.homework_assignments to authenticated; -- RLS->admin
grant select on public.submission_annotations to authenticated;
grant insert, delete on public.submission_annotations to authenticated; -- RLS->admin

-- notifications: homework event
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('submission_graded','enrollment_decided','system',
                  'new_message','payment_recorded','session_scheduled',
                  'homework_assigned'));

-- fan-out helper mirroring notify_class_session
create or replace function public.notify_class_homework(
  p_class_slug text,
  p_homework_id uuid
)
returns integer
language plpgsql security definer set search_path = '' volatile as $$
declare
  v_count integer := 0;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  insert into public.notifications (user_id, type, payload)
  select e.user_id, 'homework_assigned',
         jsonb_build_object('homeworkId', p_homework_id, 'classSlug', p_class_slug)
  from public.enrollments e
  where e.class_slug = p_class_slug and e.status = 'approved'
  on conflict do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end; $$;

revoke all on function public.notify_class_homework(text,uuid) from public, anon;
grant execute on function public.notify_class_homework(text,uuid) to authenticated;

-- expose explanations through the student-facing RPCs (replace definitions)
create or replace function public.get_lesson_exercises(p_lesson_id uuid)
returns table (
  id uuid,
  type text,
  prompt jsonb,
  payload jsonb,
  points integer,
  sort_order integer,
  explanation jsonb
)
language sql
security definer
set search_path = ''
stable
as $$
  select q.id, q.type, q.prompt, q.payload, q.points, q.sort_order, q.explanation
  from public.questions q
  where q.lesson_id = p_lesson_id
  order by q.sort_order asc;
$$;

create or replace function public.get_session_review(p_session_id uuid)
returns table (
  question_id uuid, section_id uuid, type text,
  prompt jsonb, payload jsonb, audio_path text, plays_allowed integer,
  given_answer jsonb, is_correct boolean, correct_answer jsonb,
  explanation jsonb
)
language plpgsql security definer set search_path = '' stable as $$
declare v_user uuid := auth.uid(); v_status text; v_owner uuid;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  select status, user_id into v_status, v_owner from public.mock_sessions where id = p_session_id;
  if v_owner is null then raise exception 'session_not_found'; end if;
  if v_owner <> v_user and not public.is_admin() then raise exception 'forbidden'; end if;
  if v_status = 'in_progress' then raise exception 'session_open'; end if;
  return query
  select q.id, q.section_id, q.type, q.prompt, q.payload, q.audio_path, q.plays_allowed,
         a.answer, a.is_correct, q.answer_key, q.explanation
  from public.attempts a
  join public.questions q on q.id = a.question_id
  where a.session_id = p_session_id
  order by q.sort_order asc;
end; $$;
