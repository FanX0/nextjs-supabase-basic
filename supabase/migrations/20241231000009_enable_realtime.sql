-- Enable Realtime for Projects and Profiles tables
begin;
  -- Check if publication exists (it usually does by default)
  -- Add tables to the publication
  alter publication supabase_realtime add table projects;
  alter publication supabase_realtime add table profiles;
commit;
