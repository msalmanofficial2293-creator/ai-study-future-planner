-- Profile avatars: store a Storage path on profiles; files live in the avatars bucket.
-- Apply after personalization_decisions. Does not create a second profile table.

alter table public.profiles
  add column if not exists avatar_path text;

alter table public.profiles
  drop constraint if exists profiles_avatar_path_format;

alter table public.profiles
  add constraint profiles_avatar_path_format check (
    avatar_path is null
    or (
      char_length(avatar_path) <= 200
      and avatar_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/avatar\.(jpe?g|png|webp)$'
    )
  );

comment on column public.profiles.avatar_path is
  'Object path inside the avatars Storage bucket, scoped as {auth.uid()}/avatar.{ext}. Null when using initials.';

-- Public read keeps avatar URLs usable in <img>/next/image. Writes stay user-scoped.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_select_own on storage.objects;
drop policy if exists avatars_insert_own on storage.objects;
drop policy if exists avatars_update_own on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;
drop policy if exists avatars_select_public on storage.objects;

-- Anyone can read objects in the public avatars bucket (display only).
create policy avatars_select_public on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

-- Authenticated students may only write under their own folder.
create policy avatars_insert_own on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/avatar\.(jpe?g|png|webp)$')
  );

create policy avatars_update_own on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/avatar\.(jpe?g|png|webp)$')
  );

create policy avatars_delete_own on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
