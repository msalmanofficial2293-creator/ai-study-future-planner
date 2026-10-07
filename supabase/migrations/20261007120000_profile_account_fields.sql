-- Account fields for the profile page.
-- Apply after 20261006143000_onboarding_profile.sql.
-- These columns stay on profiles. Existing select and update policies still
-- allow a student to read and change only the row where id = auth.uid().

alter table public.profiles
  add column username text,
  add column bio text,
  add column interests text,
  add column notify_study_reminders boolean not null default true,
  add column notify_product_updates boolean not null default false;

alter table public.profiles
  add constraint profiles_username_format check (
    username is null
    or username ~ '^[a-z0-9_]{3,30}$'
  ),
  add constraint profiles_bio_length check (
    bio is null or char_length(bio) <= 280
  ),
  add constraint profiles_interests_length check (
    interests is null or char_length(interests) <= 200
  );

create unique index profiles_username_key on public.profiles (username);
