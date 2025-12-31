-- Drop the old check constraint
alter table profiles drop constraint profiles_role_check;

-- Add new check constraint including 'super_admin'
alter table profiles add constraint profiles_role_check 
  check (role in ('guest', 'user', 'admin', 'super_admin'));
