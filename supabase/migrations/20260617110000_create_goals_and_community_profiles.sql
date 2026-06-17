-- 1. Create public.goals table if not exists
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  category text not null, -- 'transport', 'diet', 'energy', 'shopping', 'travel', 'total'
  target_value numeric not null,
  current_value numeric not null default 0,
  unit text not null, -- '%', 'kg', etc.
  status text not null default 'in_progress', -- 'in_progress', 'completed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create public.community_profiles table if not exists (for leaderboard opt-in privacy)
create table if not exists public.community_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  opt_in boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.goals enable row level security;
alter table public.community_profiles enable row level security;

-- 4. RLS Policies for public.goals
drop policy if exists "Users can view their own goals" on public.goals;
create policy "Users can view their own goals"
  on public.goals for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own goals" on public.goals;
create policy "Users can insert their own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own goals" on public.goals;
create policy "Users can update their own goals"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own goals" on public.goals;
create policy "Users can delete their own goals"
  on public.goals for delete
  using (auth.uid() = user_id);

-- 5. RLS Policies for public.community_profiles
drop policy if exists "Users can view all opt-in profiles" on public.community_profiles;
create policy "Users can view all opt-in profiles"
  on public.community_profiles for select
  using (true);

drop policy if exists "Users can update their own opt-in status" on public.community_profiles;
create policy "Users can update their own opt-in status"
  on public.community_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert their own opt-in status" on public.community_profiles;
create policy "Users can insert their own opt-in status"
  on public.community_profiles for insert
  with check (auth.uid() = id);
