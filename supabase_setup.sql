-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  role text default 'user',
  title text,
  bio text,
  location text,
  skills text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- DROP ALL EXISTING POLICIES to ensure a clean slate
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Admins can do everything" on public.profiles;
drop policy if exists "Specific Admin Email can do everything" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;

-- 1. VIEW: Users can ONLY view their own profile. Admin can view ALL.
create policy "View Policy"
  on public.profiles for select
  using ( 
    auth.uid() = id 
    OR 
    auth.jwt() ->> 'email' = 'rajg50103@gmail.com' 
  );

-- 2. UPDATE: Users can update OWN. Admin can update ALL.
create policy "Update Policy"
  on public.profiles for update
  using ( 
    auth.uid() = id 
    OR 
    auth.jwt() ->> 'email' = 'rajg50103@gmail.com' 
  );

-- 3. INSERT: Users can insert OWN. Admin can insert ALL.
create policy "Insert Policy"
  on public.profiles for insert
  with check ( 
    auth.uid() = id 
    OR 
    auth.jwt() ->> 'email' = 'rajg50103@gmail.com' 
  );

-- 4. DELETE: Users can delete OWN. Admin can delete ALL.
create policy "Delete Policy"
  on public.profiles for delete
  using ( 
    auth.uid() = id 
    OR 
    auth.jwt() ->> 'email' = 'rajg50103@gmail.com' 
  );

-- 5. SET THE ADMIN ROLE
-- We update the role column for the specific email so the API (which checks role column) works correctly
update public.profiles 
set role = 'admin' 
where email = 'rajg50103@gmail.com';
