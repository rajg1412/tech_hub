-- Enable RLS
alter table auth.users enable row level security;

-- Create profiles table
create table public.profiles (
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

-- Create a trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create RLS Policies

-- 1. Public can view profiles (or restrict to authenticated if you prefer)
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

-- 2. Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- 3. Users can insert their own profile (in case trigger fails or manual insert)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

-- 4. Admins can do everything
-- (We use a subquery to check if the requesting user has 'admin' role)
create policy "Admins can do everything"
  on public.profiles for all
  using (
    auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

-- SET ADMIN ROLE
-- Run this AFTER the user has signed up. If the user doesn't exist yet, run it later.
-- update public.profiles set role = 'admin' where email = 'rajg50103@gmail.com';
