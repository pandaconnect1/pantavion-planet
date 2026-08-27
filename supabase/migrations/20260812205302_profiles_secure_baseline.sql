create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  country text,
  language text not null default 'el',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles self read" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles self insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles self update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
grant select, insert, update on table public.profiles to authenticated;