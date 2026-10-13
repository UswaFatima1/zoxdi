-- Zoxdi — Supabase setup
-- ---------------------------------------------------------------------------
-- Run this once, in the Supabase dashboard → SQL Editor → New query → Run.
-- It creates two tables, locks them down with row-level security, and makes a
-- public leaderboard row whenever someone signs up.

-- 1. The saved progress blob -------------------------------------------------
-- One row per user, holding the entire ProgressState as JSON. A learner's
-- books are private: only they can read or write their own row.
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

drop policy if exists "progress_select_own" on public.progress;
drop policy if exists "progress_insert_own" on public.progress;
drop policy if exists "progress_update_own" on public.progress;
drop policy if exists "progress_delete_own" on public.progress;

create policy "progress_select_own" on public.progress
  for select using (auth.uid() = user_id);
create policy "progress_insert_own" on public.progress
  for insert with check (auth.uid() = user_id);
create policy "progress_update_own" on public.progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress_delete_own" on public.progress
  for delete using (auth.uid() = user_id);

-- 2. The public leaderboard row ----------------------------------------------
-- Display fields only. No email, no answers — safe to let anyone read.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null default 'Learner',
  avatar     text not null default '🙂',
  xp         integer not null default 0,
  levels     integer not null default 0,
  streak     integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_read_all" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

-- Anyone, signed in or not, may read the board.
create policy "profiles_read_all" on public.profiles
  for select using (true);
-- You may only create or edit your own row.
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- A read-only view the leaderboard queries. `security_invoker` keeps RLS in
-- force for whoever is asking.
create or replace view public.leaderboard
  with (security_invoker = true) as
  select id, name, avatar, xp, levels
  from public.profiles
  order by xp desc, levels desc, name asc
  limit 100;

-- 3. Create the leaderboard row automatically on sign-up ---------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), 'Learner'),
    coalesce(nullif(new.raw_user_meta_data ->> 'avatar', ''), '🙂')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
