-- Aura — Initial Schema
-- Arcana project (jpwmfztcprbwkpbkyiqm) — namespaced as aura_*
-- Run via: supabase db push

-- ── Enable UUID extension ──────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── aura_profiles ─────────────────────────────────────────────────────────────
create table if not exists public.aura_profiles (
  id                uuid        primary key references auth.users(id) on delete cascade,
  subscription_tier text        not null default 'free',
  readings_used     integer     not null default 0,
  created_at        timestamptz not null default now()
);

alter table public.aura_profiles enable row level security;

create policy "aura: users can view own profile"
  on public.aura_profiles for select
  using (auth.uid() = id);

create policy "aura: users can update own profile"
  on public.aura_profiles for update
  using (auth.uid() = id);

create policy "aura: users can insert own profile"
  on public.aura_profiles for insert
  with check (auth.uid() = id);

-- ── aura_readings ─────────────────────────────────────────────────────────────
create table if not exists public.aura_readings (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.aura_profiles(id) on delete cascade,
  -- The 10-question intake answers stored as a structured object
  questionnaire   jsonb,
  -- Core reading output fields
  dominant_color  text,
  energy_field    text,
  strengths       jsonb,       -- array of strength strings/objects
  blocks          jsonb,       -- array of block strings/objects
  chakra_insights jsonb,       -- keyed by chakra name
  -- Guidance output: colors, crystals, practices
  guidance        jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists aura_readings_user_id_idx  on public.aura_readings(user_id);
create index if not exists aura_readings_created_at_idx on public.aura_readings(created_at desc);

alter table public.aura_readings enable row level security;

create policy "aura: users can view own readings"
  on public.aura_readings for select
  using (auth.uid() = user_id);

create policy "aura: users can insert own readings"
  on public.aura_readings for insert
  with check (auth.uid() = user_id);

create policy "aura: users can update own readings"
  on public.aura_readings for update
  using (auth.uid() = user_id);

-- Service role bypass (for edge function inserts)
create policy "aura: service role full access"
  on public.aura_readings for all
  using (auth.role() = 'service_role');

-- ── Auto-create aura_profiles on auth.users insert ────────────────────────────
create or replace function public.handle_new_aura_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.aura_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop and recreate so this migration is idempotent
drop trigger if exists on_auth_user_created_aura on auth.users;

create trigger on_auth_user_created_aura
  after insert on auth.users
  for each row execute procedure public.handle_new_aura_user();

-- ── Increment readings counter ────────────────────────────────────────────────
create or replace function public.increment_aura_readings_used(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.aura_profiles
  set readings_used = readings_used + 1
  where id = p_user_id;
end;
$$;
