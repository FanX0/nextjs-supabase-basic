-- ==========================================
-- FINAL FIX FOR INFINITE RECURSION (RLS)
-- ==========================================

-- 1. Create a secure function to check user role (bypasses RLS loop)
create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

-- 2. Drop any and all potentially conflicting policies on 'profiles'
drop policy if exists "Admins can update any profile." on profiles;
drop policy if exists "Super admins can update any profile" on profiles;
drop policy if exists "Admins can update profiles but not elevate roles" on profiles;
drop policy if exists "Admins and Super Admins can update any profile" on profiles;
-- Also drop any other named variations we might have missed, if SQL allows (it doesn't support wildcards easily)
-- We rely on the specific names we know.

-- 3. Create the ONE TRUE policy for Admins/Super Admins on Profiles
create policy "Admins and Super Admins can update any profile"
  on profiles
  for update
  using (
    get_my_role() in ('admin', 'super_admin')
  );

-- 4. Fix Projects Policy
drop policy if exists "Admins can do everything on projects." on projects;
drop policy if exists "Admins and Super Admins can do everything on projects" on projects;

create policy "Admins and Super Admins can do everything on projects"
  on projects
  for all
  using (
    get_my_role() in ('admin', 'super_admin')
  );
