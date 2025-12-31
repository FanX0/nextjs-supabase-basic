-- =========================================================
-- SUPER NUKE: DYNAMICALLY DROP ALL PROFILES POLICIES
-- This script loops through the system tables and drops
-- EVERY policy on 'profiles', no matter what it is named.
-- =========================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Loop through all policies on the 'profiles' table
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) LOOP
    -- Execute a drop for each found policy
    RAISE NOTICE 'Dropping policy: %', r.policyname;
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
  END LOOP;
END $$;

-- =========================================================
-- RE-APPLY CLEAN POLICIES
-- =========================================================

-- 1. Secure Function (ensure it exists)
create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

-- 2. Basic Access
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 3. Admin Access (Secured)
create policy "Admins and Super Admins can update any profile"
  on profiles
  for update
  using (
    get_my_role() in ('admin', 'super_admin')
  );

-- 4. Clean up Projects Policies too (prevent cross-recursion)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects' AND policyname LIKE '%Admin%'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON projects', r.policyname);
  END LOOP;
END $$;

create policy "Admins and Super Admins can do everything on projects"
  on projects
  for all
  using (
    get_my_role() in ('admin', 'super_admin')
  );
