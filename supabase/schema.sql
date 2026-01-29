-- Japanese Helper MVP schema (Supabase / Postgres)
-- How to apply:
-- 1) Supabase Dashboard → SQL Editor → New query
-- 2) Paste this file and run

-- Extensions
create extension if not exists pgcrypto;

-- =========================================
-- Tables
-- =========================================

create table if not exists public.vocab_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Needed for composite foreign keys (id, user_id)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vocab_lists_id_user_id_unique'
  ) then
    -- If an index with the same name already exists, reuse it.
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'i'
        and c.relname = 'vocab_lists_id_user_id_unique'
    ) then
      alter table public.vocab_lists
        add constraint vocab_lists_id_user_id_unique unique using index vocab_lists_id_user_id_unique;
    else
      alter table public.vocab_lists
        add constraint vocab_lists_id_user_id_unique unique (id, user_id);
    end if;
  end if;
end $$;

create table if not exists public.vocab_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  list_id uuid not null references public.vocab_lists (id) on delete cascade,

  -- Japanese fields
  ja_surface text not null,
  ja_reading_hira text null, -- TODO: auto-generate (future)

  -- Optional Korean meaning / memo
  ko_meaning text null,
  memo text null,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint vocab_items_list_id_user_id_fkey
    foreign key (list_id, user_id)
    references public.vocab_lists (id, user_id)
    on delete cascade
);

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  list_id uuid not null references public.vocab_lists (id) on delete cascade,
  problem_count int not null default 10,
  created_at timestamptz not null default now(),

  constraint practice_sessions_problem_count_check check (problem_count > 0 and problem_count <= 50)
);

-- Needed for composite foreign keys (id, user_id)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'practice_sessions_id_user_id_unique'
  ) then
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'i'
        and c.relname = 'practice_sessions_id_user_id_unique'
    ) then
      alter table public.practice_sessions
        add constraint practice_sessions_id_user_id_unique unique using index practice_sessions_id_user_id_unique;
    else
      alter table public.practice_sessions
        add constraint practice_sessions_id_user_id_unique unique (id, user_id);
    end if;
  end if;
end $$;

create table if not exists public.practice_problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.practice_sessions (id) on delete cascade,

  prompt_ko text not null,
  target_item_ids uuid[] not null default '{}'::uuid[],

  model_answer_ja text not null,
  alt_answer_ja text null,

  created_at timestamptz not null default now(),

  constraint practice_problems_session_user_fkey
    foreign key (session_id, user_id)
    references public.practice_sessions (id, user_id)
    on delete cascade
);

-- Needed for composite foreign keys (id, user_id)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'practice_problems_id_user_id_unique'
  ) then
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'i'
        and c.relname = 'practice_problems_id_user_id_unique'
    ) then
      alter table public.practice_problems
        add constraint practice_problems_id_user_id_unique unique using index practice_problems_id_user_id_unique;
    else
      alter table public.practice_problems
        add constraint practice_problems_id_user_id_unique unique (id, user_id);
    end if;
  end if;
end $$;

-- NOTE: Some Postgres versions do not support `CREATE TYPE IF NOT EXISTS`.
-- Use an idempotent DO block instead.
do $$
begin
  create type public.practice_verdict as enum ('perfect', 'acceptable', 'needs_fix');
exception
  when duplicate_object then null;
end $$;

-- JLPT level (global user setting + session snapshot)
do $$
begin
  create type public.jlpt_level as enum ('n1', 'n2', 'n3', 'n4', 'n5');
exception
  when duplicate_object then null;
end $$;

-- User settings (1 row per user)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  jlpt_level public.jlpt_level not null default 'n3',
  updated_at timestamptz not null default now()
);

-- practice_sessions: store the chosen difficulty per session (problem group)
do $$
begin
  alter table public.practice_sessions
    add column jlpt_level public.jlpt_level not null default 'n3';
exception
  when duplicate_column then null;
end $$;

create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id uuid not null references public.practice_problems (id) on delete cascade,

  user_answer_ja text not null,
  verdict public.practice_verdict not null,
  feedback text null,

  created_at timestamptz not null default now(),

  constraint practice_attempts_problem_user_fkey
    foreign key (problem_id, user_id)
    references public.practice_problems (id, user_id)
    on delete cascade
);

-- =========================================
-- Row Level Security (RLS)
-- =========================================

alter table public.vocab_lists enable row level security;
alter table public.vocab_items enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.practice_problems enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.user_settings enable row level security;

-- vocab_lists: owner-only
drop policy if exists "vocab_lists_select_own" on public.vocab_lists;
create policy "vocab_lists_select_own"
on public.vocab_lists for select
using (auth.uid() = user_id);

drop policy if exists "vocab_lists_insert_own" on public.vocab_lists;
create policy "vocab_lists_insert_own"
on public.vocab_lists for insert
with check (auth.uid() = user_id);

drop policy if exists "vocab_lists_update_own" on public.vocab_lists;
create policy "vocab_lists_update_own"
on public.vocab_lists for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "vocab_lists_delete_own" on public.vocab_lists;
create policy "vocab_lists_delete_own"
on public.vocab_lists for delete
using (auth.uid() = user_id);

-- vocab_items: owner-only
drop policy if exists "vocab_items_select_own" on public.vocab_items;
create policy "vocab_items_select_own"
on public.vocab_items for select
using (auth.uid() = user_id);

drop policy if exists "vocab_items_insert_own" on public.vocab_items;
create policy "vocab_items_insert_own"
on public.vocab_items for insert
with check (auth.uid() = user_id);

drop policy if exists "vocab_items_update_own" on public.vocab_items;
create policy "vocab_items_update_own"
on public.vocab_items for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "vocab_items_delete_own" on public.vocab_items;
create policy "vocab_items_delete_own"
on public.vocab_items for delete
using (auth.uid() = user_id);

-- practice_sessions: owner-only
drop policy if exists "practice_sessions_select_own" on public.practice_sessions;
create policy "practice_sessions_select_own"
on public.practice_sessions for select
using (auth.uid() = user_id);

drop policy if exists "practice_sessions_insert_own" on public.practice_sessions;
create policy "practice_sessions_insert_own"
on public.practice_sessions for insert
with check (auth.uid() = user_id);

drop policy if exists "practice_sessions_update_own" on public.practice_sessions;
create policy "practice_sessions_update_own"
on public.practice_sessions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "practice_sessions_delete_own" on public.practice_sessions;
create policy "practice_sessions_delete_own"
on public.practice_sessions for delete
using (auth.uid() = user_id);

-- practice_problems: owner-only
drop policy if exists "practice_problems_select_own" on public.practice_problems;
create policy "practice_problems_select_own"
on public.practice_problems for select
using (auth.uid() = user_id);

drop policy if exists "practice_problems_insert_own" on public.practice_problems;
create policy "practice_problems_insert_own"
on public.practice_problems for insert
with check (auth.uid() = user_id);

drop policy if exists "practice_problems_update_own" on public.practice_problems;
create policy "practice_problems_update_own"
on public.practice_problems for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "practice_problems_delete_own" on public.practice_problems;
create policy "practice_problems_delete_own"
on public.practice_problems for delete
using (auth.uid() = user_id);

-- practice_attempts: owner-only
drop policy if exists "practice_attempts_select_own" on public.practice_attempts;
create policy "practice_attempts_select_own"
on public.practice_attempts for select
using (auth.uid() = user_id);

drop policy if exists "practice_attempts_insert_own" on public.practice_attempts;
create policy "practice_attempts_insert_own"
on public.practice_attempts for insert
with check (auth.uid() = user_id);

drop policy if exists "practice_attempts_update_own" on public.practice_attempts;
create policy "practice_attempts_update_own"
on public.practice_attempts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "practice_attempts_delete_own" on public.practice_attempts;
create policy "practice_attempts_delete_own"
on public.practice_attempts for delete
using (auth.uid() = user_id);

-- user_settings: owner-only
drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
on public.user_settings for select
using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
on public.user_settings for insert
with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
on public.user_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own"
on public.user_settings for delete
using (auth.uid() = user_id);


