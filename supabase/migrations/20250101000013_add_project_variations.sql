-- Create project_variations table
create table public.project_variations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10, 2), -- Optional price
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.project_variations enable row level security;

-- Policies

-- 1. View: Users can view variations of projects they can view (inherited logic)
--    Simplest for now: Users can view variations of their own projects.
create policy "Users can view variations of own projects."
  on public.project_variations for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_variations.project_id
      and projects.user_id = auth.uid()
    )
  );

-- 2. Insert: Users can insert variations into their own projects.
create policy "Users can insert variations into own projects."
  on public.project_variations for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_variations.project_id
      and projects.user_id = auth.uid()
    )
  );

-- 3. Update: Users can update variations of their own projects.
create policy "Users can update variations of own projects."
  on public.project_variations for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_variations.project_id
      and projects.user_id = auth.uid()
    )
  );

-- 4. Delete: Users can delete variations of their own projects.
create policy "Users can delete variations of own projects."
  on public.project_variations for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_variations.project_id
      and projects.user_id = auth.uid()
    )
  );
