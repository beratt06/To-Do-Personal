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
create policy "Authenticated can read shared app state"
  on public.shared_app_state for select to authenticated
  using (true);

drop policy if exists "Anyone can insert shared app state" on public.shared_app_state;
create policy "Authenticated can insert shared app state"
  on public.shared_app_state for insert to authenticated
  with check (true);

drop policy if exists "Anyone can update shared app state" on public.shared_app_state;
create policy "Authenticated can update shared app state"
  on public.shared_app_state for update to authenticated
  using (true)
  with check (true);

-- Create RPCs to allow anonymous clients to get/set shared state by providing the shared password.
drop function if exists public.get_shared_state(text);
create function public.get_shared_state(pwd text)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  ok boolean;
  result jsonb;
begin
  select public.verify_shared_password(pwd) into ok;
  if not ok then
    return null;
  end if;
  select data into result from public.shared_app_state where id = 'shared';
  return coalesce(result, '{}'::jsonb);
end;
$$;

drop function if exists public.upsert_shared_state(text, jsonb);
create function public.upsert_shared_state(pwd text, payload jsonb)
returns void
language plpgsql
security definer
stable
as $$
declare
  ok boolean;
begin
  select public.verify_shared_password(pwd) into ok;
  if not ok then
    raise exception 'authentication failed' using hint = 'invalid shared password';
  end if;

  insert into public.shared_app_state (id, data, updated_at)
  values ('shared', payload, now())
  on conflict (id) do update set data = excluded.data, updated_at = now();
end;
$$;

grant execute on function public.get_shared_state(text) to public;
grant execute on function public.upsert_shared_state(text, jsonb) to public;

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

-- Ensure pgcrypto is available for secure password hashing
create extension if not exists pgcrypto;

-- If you previously stored a plaintext shared password under key 'shared_password',
-- convert it to a bcrypt hash and store as 'shared_password_hash'. Run this once
-- in Supabase SQL Editor as an admin (service_role) or via the SQL editor in the dashboard.
do $$
begin
  if exists(select 1 from public.app_settings where key = 'shared_password') then
    -- Insert hashed value into shared_password_hash using bcrypt via crypt()
    insert into public.app_settings (key, value)
    select 'shared_password_hash', crypt(value, gen_salt('bf', 12))
    from public.app_settings
    where key = 'shared_password'
    on conflict (key) do update set value = excluded.value, updated_at = now();
  end if;
end$$;

-- Create server-side verifier that compares a plaintext password to the stored hash.
-- This function runs with definer privileges so you can grant execute to anon
-- without exposing the hash itself.
drop function if exists public.verify_shared_password(text);
create function public.verify_shared_password(pwd text)
returns boolean
language sql
security definer
stable
as $$
  select case when count(*) = 0 then false
    else (
      -- Use crypt() to compare password to stored bcrypt hash
      (crypt(pwd, value) = value)
    ) end
  from public.app_settings
  where key = 'shared_password_hash';
$$;

-- Allow execution of the verifier to anonymous clients, but do NOT grant select on app_settings.
grant execute on function public.verify_shared_password(text) to public;

-- Optional: remove the plaintext shared_password key if present. Run only after verifying everything works.
-- delete from public.app_settings where key = 'shared_password';
