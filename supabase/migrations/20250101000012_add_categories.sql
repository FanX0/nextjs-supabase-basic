-- Create categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text, -- e.g. 'red', 'blue', '#ff0500'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.categories enable row level security;

-- Policies for Categories
-- 1. Everyone can view categories (so they can select them)
create policy "Categories are viewable by everyone."
  on public.categories for select
  using ( true );

-- 2. Only Admins can insert/update/delete
create policy "Only Admins can insert categories."
  on public.categories for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

create policy "Only Admins can update categories."
  on public.categories for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

create policy "Only Admins can delete categories."
  on public.categories for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

-- Add category_id to projects
alter table public.projects 
add column category_id uuid references public.categories(id) on delete set null;
