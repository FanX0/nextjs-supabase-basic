-- Allow Admins to update any profile
create policy "Admins can update any profile."
  on profiles for update
  using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );
