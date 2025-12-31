-- =========================================================
-- RESET ALL PROFILES RLS (NUCLEAR OPTION)
-- Use this if you are stuck with "Infinite Recursion" errors.
-- =========================================================

-- 1. Ensure the secure function exists
create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

-- 2. DROP ALL KNOWN POLICIES ON PROFILES
-- We drop everything to ensure no rogue "FOR SELECT" policy remains.
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;
drop policy if exists "Admins can update any profile." on profiles;
drop policy if exists "Super admins can update any profile" on profiles;
drop policy if exists "Admins can update profiles but not elevate roles" on profiles;
drop policy if exists "Admins and Super Admins can update any profile" on profiles;
drop policy if exists "Enable read access for all users" on profiles;
drop policy if exists "Enable insert for users based on user_id" on profiles;
drop policy if exists "Enable update for users based on email" on profiles;

-- 3. RECREATE BASIC POLICIES (Non-recursive)
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 4. RECREATE ADMIN POLICY (Secured)
create policy "Admins and Super Admins can update any profile"
  on profiles
  for update
  using (
    get_my_role() in ('admin', 'super_admin')
  );

-- 5. VERIFY (Optional: Select to ensure no error)
-- This won't output in the editor usually unless explicit, but it's a safe check if run as query.
select count(*) from profiles;
