-- 1. Create handle_new_user trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', null),
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Drop the trigger if it already exists, to ensure migration is safe and repeatable
drop trigger if exists on_auth_user_created on auth.users;

-- 3. Bind the trigger to auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Enable Row Level Security (RLS) on public.profiles
alter table public.profiles enable row level security;

-- 5. RLS Policies for public.profiles
-- SELECT: Public profiles read access for leaderboard/community features
drop policy if exists "Public profiles are readable by everyone" on public.profiles;
create policy "Public profiles are readable by everyone"
  on public.profiles for select
  using (true);

-- UPDATE: Owner-only profile updates
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- DELETE: Owner-only profile deletion
drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- INSERT: Disabled for client-side queries (profiles are only created by database triggers)

-- 6. Configure storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 7. Storage policies for avatars bucket
-- SELECT: Publicly accessible
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- INSERT: Authenticated users can upload to their own subdirectory
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE: Authenticated users can modify their own avatar
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: Authenticated users can remove their own avatar
drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
