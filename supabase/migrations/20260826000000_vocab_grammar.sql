-- Phase 4: spaced-repetition vocabulary + public grammar bank
-- vocab_decks/cards : teaching content (public read, admin write)
-- vocab_reviews     : per-user SM-2 scheduling state (owner-only)
-- study_log         : one row per study day -> powers the streak
-- grammar_topics    : public grammar bank
-- lesson_grammar    : many-to-many lessons <-> topics

create table if not exists public.vocab_decks (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null,
  description jsonb,
  domain text not null default 'alltag'
    check (domain in ('alltag','studium','umwelt','arbeit_wirtschaft','medien','gesellschaft')),
  class_slug text references public.classes(slug) on delete set null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.vocab_cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.vocab_decks(id) on delete cascade,
  front_de text not null check (length(front_de) between 1 and 200),
  word_type text not null default 'other'
    check (word_type in ('noun','verb','adjective','phrase','other')),
  hint jsonb,                -- LocalizedString, optional
  example_de text,
  example_en text,
  example_fa text,
  audio_path text,           -- reserved for future listening support
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.vocab_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.vocab_cards(id) on delete cascade,
  ease_factor numeric(4,3) not null default 2.500 check (ease_factor >= 1.300),
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0,
  lapses integer not null default 0,
  due_at timestamptz not null default now(),
  last_grade smallint check (last_grade between 2 and 5),
  last_reviewed_at timestamptz,
  primary key (user_id, card_id)
);

create table if not exists public.study_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  study_date date not null,
  reviews_done integer not null default 0 check (reviews_done >= 0),
  primary key (user_id, study_date)
);

create table if not exists public.grammar_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  title jsonb not null,
  level text not null check (level in ('a1','a2','b1','b2','c1','c2')),
  explanation jsonb not null,
  examples jsonb not null default '[]'::jsonb, -- [{de,en,fa}, ...]
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_grammar (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  topic_id uuid not null references public.grammar_topics(id) on delete cascade,
  primary key (lesson_id, topic_id)
);

create index if not exists idx_vocab_cards_deck on public.vocab_cards(deck_id);
create index if not exists idx_vocab_reviews_due on public.vocab_reviews(user_id, due_at);
create index if not exists idx_study_log_user on public.study_log(user_id, study_date desc);
create index if not exists idx_grammar_topics_level on public.grammar_topics(level);
create index if not exists idx_lesson_grammar_topic on public.lesson_grammar(topic_id);

alter table public.vocab_decks enable row level security;
alter table public.vocab_cards enable row level security;
alter table public.vocab_reviews enable row level security;
alter table public.study_log enable row level security;
alter table public.grammar_topics enable row level security;
alter table public.lesson_grammar enable row level security;

-- decks/cards: public read, admin write (mirrors lessons)
drop policy if exists "vdecks_public_read" on public.vocab_decks;
create policy "vdecks_public_read" on public.vocab_decks for select
  to anon, authenticated using (true);
drop policy if exists "vdecks_admin_insert" on public.vocab_decks;
create policy "vdecks_admin_insert" on public.vocab_decks for insert
  to authenticated with check (public.is_admin());
drop policy if exists "vdecks_admin_update" on public.vocab_decks;
create policy "vdecks_admin_update" on public.vocab_decks for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "vdecks_admin_delete" on public.vocab_decks;
create policy "vdecks_admin_delete" on public.vocab_decks for delete
  to authenticated using (public.is_admin());

drop policy if exists "vcards_public_read" on public.vocab_cards;
create policy "vcards_public_read" on public.vocab_cards for select
  to anon, authenticated using (true);
drop policy if exists "vcards_admin_insert" on public.vocab_cards;
create policy "vcards_admin_insert" on public.vocab_cards for insert
  to authenticated with check (public.is_admin());
drop policy if exists "vcards_admin_update" on public.vocab_cards;
create policy "vcards_admin_update" on public.vocab_cards for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "vcards_admin_delete" on public.vocab_cards;
create policy "vcards_admin_delete" on public.vocab_cards for delete
  to authenticated using (public.is_admin());

-- reviews/study_log: strictly owner
drop policy if exists "vrev_owner_select" on public.vocab_reviews;
create policy "vrev_owner_select" on public.vocab_reviews for select
  to authenticated using (user_id = auth.uid());
drop policy if exists "vrev_owner_insert" on public.vocab_reviews;
create policy "vrev_owner_insert" on public.vocab_reviews for insert
  to authenticated with check (user_id = auth.uid());
drop policy if exists "vrev_owner_update" on public.vocab_reviews;
create policy "vrev_owner_update" on public.vocab_reviews for update
  to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "slog_owner_select" on public.study_log;
create policy "slog_owner_select" on public.study_log for select
  to authenticated using (user_id = auth.uid());
drop policy if exists "slog_owner_insert" on public.study_log;
create policy "slog_owner_insert" on public.study_log for insert
  to authenticated with check (user_id = auth.uid());
drop policy if exists "slog_owner_update" on public.study_log;
create policy "slog_owner_update" on public.study_log for update
  to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- grammar: public read, admin write
drop policy if exists "gtags_public_read" on public.grammar_topics;
create policy "gtags_public_read" on public.grammar_topics for select
  to anon, authenticated using (true);
drop policy if exists "gtags_admin_insert" on public.grammar_topics;
create policy "gtags_admin_insert" on public.grammar_topics for insert
  to authenticated with check (public.is_admin());
drop policy if exists "gtags_admin_update" on public.grammar_topics;
create policy "gtags_admin_update" on public.grammar_topics for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "gtags_admin_delete" on public.grammar_topics;
create policy "gtags_admin_delete" on public.grammar_topics for delete
  to authenticated using (public.is_admin());

drop policy if exists "lg_public_read" on public.lesson_grammar;
create policy "lg_public_read" on public.lesson_grammar for select
  to anon, authenticated using (true);
drop policy if exists "lg_admin_insert" on public.lesson_grammar;
create policy "lg_admin_insert" on public.lesson_grammar for insert
  to authenticated with check (public.is_admin());
drop policy if exists "lg_admin_delete" on public.lesson_grammar;
create policy "lg_admin_delete" on public.lesson_grammar for delete
  to authenticated using (public.is_admin());

-- grants
revoke all on public.vocab_decks from anon, authenticated;
revoke all on public.vocab_cards from anon, authenticated;
revoke all on public.vocab_reviews from anon, authenticated;
revoke all on public.study_log from anon, authenticated;
revoke all on public.grammar_topics from anon, authenticated;
revoke all on public.lesson_grammar from anon, authenticated;

grant select on public.vocab_decks to anon, authenticated;
grant select on public.vocab_cards to anon, authenticated;
grant insert, update, delete on public.vocab_decks to authenticated; -- RLS->admin
grant insert, update, delete on public.vocab_cards to authenticated; -- RLS->admin
grant select, insert, update on public.vocab_reviews to authenticated;
grant select, insert, update on public.study_log to authenticated;
grant select on public.grammar_topics to anon, authenticated;
grant insert, update, delete on public.grammar_topics to authenticated; -- RLS->admin
grant select on public.lesson_grammar to anon, authenticated;
grant insert, delete on public.lesson_grammar to authenticated;         -- RLS->admin
