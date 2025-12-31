-- Drop the restrictive policy (only own projects)
drop policy "Users can view own projects." on projects;

-- Create a permissive policy (everyone can view)
create policy "Projects are viewable by everyone."
  on projects for select
  using ( true );
