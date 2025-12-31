-- 1. Add image_url to projects table
alter table projects add column image_url text;

-- 2. Create Storage Buckets
insert into storage.buckets (id, name, public)
values 
  ('avatars', 'avatars', true),
  ('project_images', 'project_images', true)
on conflict (id) do nothing;

-- 3. Set up RLS for "avatars" bucket
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' ); 
  -- In a stricter app, you might restrict this to auth users, 
  -- but for "Invite" flows sometimes unauth upload is needed or simpler to manage initially.
  -- Let's stick to auth users for now to be safe, assuming invites login first? 
  -- Wait, invite flow: user clicks link -> sets password (is logged in) -> profile creation.
  -- Actually profile creation happens on trigger. User updates profile later.
  
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Users can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner );

-- 4. Set up RLS for "project_images" bucket
create policy "Project images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'project_images' );

create policy "Authenticated users can upload project images."
  on storage.objects for insert
  with check ( bucket_id = 'project_images' and auth.role() = 'authenticated' );

create policy "Users can update their own project images"
  on storage.objects for update
  using ( bucket_id = 'project_images' and auth.uid() = owner );

create policy "Users can delete their own project images"
  on storage.objects for delete
  using ( bucket_id = 'project_images' and auth.uid() = owner );
