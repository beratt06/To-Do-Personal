-- Run this once in Supabase Dashboard > SQL Editor.
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_app_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
alter table public.shared_app_state enable row level security;

drop policy if exists "Users can read app settings" on public.app_settings;
create policy "Users can read app settings"
  on public.app_settings for select to authenticated
  using (true);

drop policy if exists "Users can manage app settings" on public.app_settings;
create policy "Users can manage app settings"
  on public.app_settings for insert to authenticated
  with check (true);
create policy "Users can update app settings"
  on public.app_settings for update to authenticated
  using (true)
  with check (true);

drop policy if exists "Anyone can read shared app state" on public.shared_app_state;
create policy "Anyone can read shared app state"
  on public.shared_app_state for select to anon, authenticated
  using (true);

drop policy if exists "Anyone can insert shared app state" on public.shared_app_state;
create policy "Anyone can insert shared app state"
  on public.shared_app_state for insert to anon, authenticated
  with check (true);

drop policy if exists "Anyone can update shared app state" on public.shared_app_state;
create policy "Anyone can update shared app state"
  on public.shared_app_state for update to anon, authenticated
  using (true)
  with check (true);

alter table public.user_data enable row level security;

drop policy if exists "Users can read their own FocusFlow data" on public.user_data;
create policy "Users can read their own FocusFlow data"
  on public.user_data for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own FocusFlow data" on public.user_data;
create policy "Users can create their own FocusFlow data"
  on public.user_data for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own FocusFlow data" on public.user_data;
create policy "Users can update their own FocusFlow data"
  on public.user_data for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
