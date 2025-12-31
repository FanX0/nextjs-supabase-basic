-- Update the handle_new_user function to be more robust for OAuth providers
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_full_name text;
  user_avatar_url text;
begin
  -- Try to find the best name from metadata
  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'user_name',
    split_part(new.email, '@', 1) -- Fallback to email prefix
  );

  -- Try to find the best avatar
  user_avatar_url := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    new.raw_user_meta_data->>'avatar'
  );

  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, user_full_name, user_avatar_url, 'user');
  
  return new;
end;
$$;
