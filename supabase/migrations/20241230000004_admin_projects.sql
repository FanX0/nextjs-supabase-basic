-- Allow Admins and Super Admins to select/insert/update/delete ALL projects
create policy "Admins can do everything on projects."
  on projects
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() 
      and role in ('admin', 'super_admin')
    )
  );
