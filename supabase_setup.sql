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

-- 1a. Security Definer Function to check Admin Role (Avoids Recursion)
create or replace function public.is_admin()
returns boolean as $$
declare
  current_role text;
begin
  select role into current_role from public.profiles
  where id = auth.uid();
  return current_role = 'admin';
end;
$$ language plpgsql security definer;

-- 2. VIEW: Users can ONLY view their own profile. Admin can view ALL.
create policy "View Policy"
  on public.profiles for select
  using ( 
    auth.uid() = id 
    OR 
    public.is_admin()
  );

-- 3. UPDATE: Users can update OWN. Admin can update ALL.
create policy "Update Policy"
  on public.profiles for update
  using ( 
    auth.uid() = id 
    OR 
    public.is_admin()
  );

-- 4. INSERT: Users can insert OWN. Admin can insert ALL.
create policy "Insert Policy"
  on public.profiles for insert
  with check ( 
    auth.uid() = id 
    OR 
    public.is_admin()
  );

-- 5. DELETE: Users can delete OWN. Admin can delete ALL.
create policy "Delete Policy"
  on public.profiles for delete
  using ( 
    auth.uid() = id 
    OR 
    public.is_admin()
  );

-- 5. SET THE ADMIN ROLE
-- We update the role column for the specific email so the API (which checks role column) works correctly
update public.profiles 
set role = 'admin' 
where email = 'rajg50103@gmail.com';
