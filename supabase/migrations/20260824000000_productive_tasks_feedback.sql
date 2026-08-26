-- Phase 2: productive skills (Schreiben/Sprechen) + teacher feedback loop
-- tasks      : open-ended prompts attached to lessons (writing / speaking)
-- submissions: student answers, teacher rubric grading + feedback
-- notifications: per-user inbox (v1: submission_graded events)
-- Storage: PRIVATE bucket 'submissions' — students write ONLY into their
-- own auth.uid() top-level folder; admins may read (signed URLs).

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  skill text not null check (skill in ('schreiben','sprechen')),
  prompt jsonb not null,
  time_limit_min integer,
  word_min integer,
  word_max integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('text','audio')),
  body text,
  file_path text,
  teacher_feedback text,
  rubric_scores jsonb,
  status text not null default 'pending' check (status in ('pending','graded')),
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (task_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'system'
    check (type in ('submission_graded','enrollment_decided','system')),
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_tasks_lesson on public.tasks(lesson_id);
create index if not exists idx_submissions_user on public.submissions(user_id);
create index if not exists idx_submissions_task on public.submissions(task_id);
create index if not exists idx_submissions_pending
  on public.submissions(status) where status = 'pending';
create index if not exists idx_notifications_user
  on public.notifications(user_id, read);

alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.notifications enable row level security;

-- tasks: public read, admin write (mirrors lessons)
drop policy if exists "tasks_public_read" on public.tasks;
create policy "tasks_public_read" on public.tasks for select
  to anon, authenticated using (true);
drop policy if exists "tasks_admin_insert" on public.tasks;
create policy "tasks_admin_insert" on public.tasks for insert
  to authenticated with check (public.is_admin());
drop policy if exists "tasks_admin_update" on public.tasks;
create policy "tasks_admin_update" on public.tasks for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "tasks_admin_delete" on public.tasks;
create policy "tasks_admin_delete" on public.tasks for delete
  to authenticated using (public.is_admin());

-- submissions: owner insert/read/resubmit(pending only), admin full
drop policy if exists "submissions_owner_select" on public.submissions;
create policy "submissions_owner_select" on public.submissions for select
  to authenticated using (user_id = auth.uid());
drop policy if exists "submissions_owner_insert" on public.submissions;
create policy "submissions_owner_insert" on public.submissions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and teacher_feedback is null
    and rubric_scores is null
  );
drop policy if exists "submissions_owner_update" on public.submissions;
create policy "submissions_owner_update" on public.submissions for update
  to authenticated
  using (user_id = auth.uid() and status = 'pending')
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and teacher_feedback is null
    and rubric_scores is null
  );
drop policy if exists "submissions_admin_select" on public.submissions;
create policy "submissions_admin_select" on public.submissions for select
  to authenticated using (public.is_admin());
drop policy if exists "submissions_admin_update" on public.submissions;
create policy "submissions_admin_update" on public.submissions for update
  to authenticated using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "submissions_admin_delete" on public.submissions;
create policy "submissions_admin_delete" on public.submissions for delete
  to authenticated using (public.is_admin());

-- notifications: owner read/mark-read, admin insert/cleanup
drop policy if exists "notifications_owner_select" on public.notifications;
create policy "notifications_owner_select" on public.notifications for select
  to authenticated using (user_id = auth.uid());
drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update" on public.notifications for update
  to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());
drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_admin_insert" on public.notifications for insert
  to authenticated with check (public.is_admin());
drop policy if exists "notifications_admin_delete" on public.notifications;
create policy "notifications_admin_delete" on public.notifications for delete
  to authenticated using (public.is_admin());

-- Grants (explicit, minimal; policies are the real gate)
revoke all on public.tasks from anon, authenticated;
revoke all on public.submissions from anon, authenticated;
revoke all on public.notifications from anon, authenticated;

grant select on public.tasks to anon, authenticated;
grant insert, update, delete on public.tasks to authenticated;   -- RLS -> admin only
grant select, insert, update on public.submissions to authenticated;
grant delete on public.submissions to authenticated;             -- RLS -> admin cleanup
grant select, update on public.notifications to authenticated;
grant insert, delete on public.notifications to authenticated;   -- RLS -> admin

-- ------------------------------------------------------------------
-- Storage: private 'submissions' bucket (audio recordings)
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions', 'submissions', false, 26214400,
  array['audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/x-m4a']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "sub_storage_owner_insert" on storage.objects;
create policy "sub_storage_owner_insert" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "sub_storage_owner_select" on storage.objects;
create policy "sub_storage_owner_select" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'submissions'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "sub_storage_owner_delete" on storage.objects;
create policy "sub_storage_owner_delete" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'submissions'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
