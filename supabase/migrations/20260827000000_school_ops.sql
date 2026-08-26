-- Phase 5: school operations (NO certificates per owner decision)
-- live_sessions      : scheduled teaching sessions per class
-- session_attendance : admin-marked attendance per student
-- messages           : direct student<->teacher chat (single-teacher school)
-- payments           : manually tracked tuition payments
-- notifications      : enum gains new_message / payment_recorded / session_scheduled

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  class_slug text not null references public.classes(slug) on delete cascade,
  title jsonb not null,
  starts_at timestamptz not null,
  duration_min integer not null default 60 check (duration_min between 10 and 480),
  meeting_url text,
  location_note jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.session_attendance (
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('present','absent','excused','pending')),
  noted_at timestamptz,
  primary key (session_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_slug text references public.classes(slug) on delete set null,
  amount numeric(10,2) not null check (amount > 0),
  currency text not null default 'EUR' check (currency in ('EUR','USD','IRR')),
  method text not null default 'bank_transfer'
    check (method in ('cash','bank_transfer','card','other')),
  status text not null default 'pending' check (status in ('pending','confirmed','failed')),
  paid_at timestamptz,
  period_start date,
  period_end date,
  note text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_live_sessions_class on public.live_sessions(class_slug, starts_at);
create index if not exists idx_messages_pair on public.messages(sender_id, recipient_id, created_at);
create index if not exists idx_payments_user on public.payments(user_id, created_at desc);

alter table public.live_sessions enable row level security;
alter table public.session_attendance enable row level security;
alter table public.messages enable row level security;
alter table public.payments enable row level security;

-- live_sessions: approved-enrolled students + admin may read
drop policy if exists "ls_enrolled_read" on public.live_sessions;
create policy "ls_enrolled_read" on public.live_sessions for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.user_id = auth.uid()
        and e.class_slug = live_sessions.class_slug
        and e.status = 'approved'
    )
  );
drop policy if exists "ls_admin_insert" on public.live_sessions;
create policy "ls_admin_insert" on public.live_sessions for insert
  to authenticated with check (public.is_admin());
drop policy if exists "ls_admin_update" on public.live_sessions;
create policy "ls_admin_update" on public.live_sessions for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "ls_admin_delete" on public.live_sessions;
create policy "ls_admin_delete" on public.live_sessions for delete
  to authenticated using (public.is_admin());

-- attendance: owner sees own rows; admin writes/reads all
drop policy if exists "att_owner_read" on public.session_attendance;
create policy "att_owner_read" on public.session_attendance for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "att_admin_insert" on public.session_attendance;
create policy "att_admin_insert" on public.session_attendance for insert
  to authenticated with check (public.is_admin());
drop policy if exists "att_admin_update" on public.session_attendance;
create policy "att_admin_update" on public.session_attendance for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "att_admin_delete" on public.session_attendance;
create policy "att_admin_delete" on public.session_attendance for delete
  to authenticated using (public.is_admin());

-- messages: participants only; recipient marks read; admin moderation read
drop policy if exists "msg_participant_read" on public.messages;
create policy "msg_participant_read" on public.messages for select
  to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());
drop policy if exists "msg_sender_insert" on public.messages;
create policy "msg_sender_insert" on public.messages for insert
  to authenticated with check (sender_id = auth.uid() and recipient_id <> auth.uid());
drop policy if exists "msg_recipient_markread" on public.messages;
create policy "msg_recipient_markread" on public.messages for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- payments: student sees own; admin manages everything
drop policy if exists "pay_owner_read" on public.payments;
create policy "pay_owner_read" on public.payments for select
  to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "pay_admin_insert" on public.payments;
create policy "pay_admin_insert" on public.payments for insert
  to authenticated with check (public.is_admin());
drop policy if exists "pay_admin_update" on public.payments;
create policy "pay_admin_update" on public.payments for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "pay_admin_delete" on public.payments;
create policy "pay_admin_delete" on public.payments for delete
  to authenticated using (public.is_admin());

-- grants
revoke all on public.live_sessions from anon, authenticated;
revoke all on public.session_attendance from anon, authenticated;
revoke all on public.messages from anon, authenticated;
revoke all on public.payments from anon, authenticated;
grant select on public.live_sessions to authenticated;
grant insert, update, delete on public.live_sessions to authenticated; -- RLS->admin(+enrolled-read)
grant select, insert, update, delete on public.session_attendance to authenticated; -- RLS splits roles
grant select, insert, update on public.messages to authenticated;
grant select, insert, update, delete on public.payments to authenticated; -- RLS->admin writes

-- ------------------------------------------------------------------
-- notifications: widen event enum
-- ------------------------------------------------------------------
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('submission_graded','enrollment_decided','system',
                  'new_message','payment_recorded','session_scheduled'));

-- ------------------------------------------------------------------
-- SECURITY DEFINER notify bridges
--  * notify_counterpart : student->teacher or teacher->student chat pings
--  * notify_class_session: fan-out to approved students when a session is set
-- ------------------------------------------------------------------
create or replace function public.notify_counterpart(
  p_recipient uuid,
  p_type text,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = '' volatile as $$
declare
  v_caller uuid := auth.uid();
  v_recipient_role text;
begin
  if v_caller is null then raise exception 'not_authenticated'; end if;
  if p_recipient = v_caller then raise exception 'self_notify'; end if;
  if p_type not in ('new_message','payment_recorded') then
    raise exception 'invalid_type';
  end if;

  select coalesce(u.app_metadata->>'role','')
    into v_recipient_role
  from auth.users u where u.id = p_recipient;

  -- allowed pairs only: student -> admin, admin -> student
  if v_recipient_role not in ('admin','student') then
    raise exception 'bad_recipient';
  end if;

  insert into public.notifications (user_id, type, payload)
  values (p_recipient, p_type, p_payload);
end; $$;

create or replace function public.notify_class_session(
  p_class_slug text,
  p_session_id uuid
)
returns integer
language plpgsql security definer set search_path = '' volatile as $$
declare
  v_count integer := 0;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  insert into public.notifications (user_id, type, payload)
  select e.user_id, 'session_scheduled',
         jsonb_build_object('sessionId', p_session_id, 'classSlug', p_class_slug)
  from public.enrollments e
  where e.class_slug = p_class_slug and e.status = 'approved'
  on conflict do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end; $$;

revoke all on function public.notify_counterpart(uuid,text,jsonb) from public, anon;
grant execute on function public.notify_counterpart(uuid,text,jsonb) to authenticated;
revoke all on function public.notify_class_session(text,uuid) from public, anon;
grant execute on function public.notify_class_session(text,uuid) to authenticated;
