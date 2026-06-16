-- 1. Ensure public.assessments exists, creating it only if missing
create table if not exists public.assessments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Idempotent column check and addition
do $$
begin
  -- Score fields
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='transport_score') then
    alter table public.assessments add column transport_score numeric not null default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='energy_score') then
    alter table public.assessments add column energy_score numeric not null default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='diet_score') then
    alter table public.assessments add column diet_score numeric not null default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='shopping_score') then
    alter table public.assessments add column shopping_score numeric not null default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='travel_score') then
    alter table public.assessments add column travel_score numeric not null default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='total_score') then
    alter table public.assessments add column total_score numeric not null default 0;
  end if;

  -- Metadata fields
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='grade') then
    alter table public.assessments add column grade text not null default 'F';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='is_complete') then
    alter table public.assessments add column is_complete boolean not null default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='inputs') then
    alter table public.assessments add column inputs jsonb not null default '{}'::jsonb;
  end if;

  -- Concurrency draft fields
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='draft_version') then
    alter table public.assessments add column draft_version integer not null default 1;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='last_saved_at') then
    alter table public.assessments add column last_saved_at timestamp with time zone default timezone('utc'::text, now()) not null;
  end if;
end $$;

-- 3. Data Migration: copy legacy *_kg values into the new fields if present
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='transport_kg') then
    update public.assessments set transport_score = transport_kg where transport_score = 0;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='energy_kg') then
    update public.assessments set energy_score = energy_kg where energy_score = 0;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='diet_kg') then
    update public.assessments set diet_score = diet_kg where diet_score = 0;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='shopping_kg') then
    update public.assessments set shopping_score = shopping_kg where shopping_score = 0;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='assessments' and column_name='total_kg') then
    update public.assessments set total_score = total_kg where total_score = 0;
  end if;
end $$;

-- 4. Enable RLS
alter table public.assessments enable row level security;

-- 5. Policies
drop policy if exists "Users can view their own assessments" on public.assessments;
create policy "Users can view their own assessments"
  on public.assessments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own assessments" on public.assessments;
create policy "Users can insert their own assessments"
  on public.assessments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own assessments" on public.assessments;
create policy "Users can update their own assessments"
  on public.assessments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own assessments" on public.assessments;
create policy "Users can delete their own assessments"
  on public.assessments for delete
  using (auth.uid() = user_id);
