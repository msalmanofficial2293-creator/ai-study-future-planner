-- Learner context for onboarding. Career goal and target outcome stay on goals.
-- Apply after 20261006125000_database_foundation.sql.

alter table public.profiles
  add column education_level text,
  add column field_of_study text,
  add column skill_level text,
  add column weekly_study_time text,
  add column learning_style text,
  add column onboarding_completed_at timestamptz;

alter table public.profiles
  add constraint profiles_education_level_check check (
    education_level is null
    or education_level in (
      'secondary',
      'undergraduate',
      'graduate',
      'bootcamp',
      'professional',
      'other'
    )
  ),
  add constraint profiles_field_of_study_length check (
    field_of_study is null or char_length(field_of_study) <= 120
  ),
  add constraint profiles_skill_level_check check (
    skill_level is null or skill_level in ('beginner', 'intermediate', 'advanced')
  ),
  add constraint profiles_weekly_study_time_check check (
    weekly_study_time is null
    or weekly_study_time in ('under_5', '5_to_10', '10_to_20', 'over_20')
  ),
  add constraint profiles_learning_style_check check (
    learning_style is null
    or learning_style in ('reading', 'practice', 'video', 'mixed')
  ),
  add constraint profiles_onboarding_complete_check check (
    onboarding_completed_at is null
    or (
      char_length(btrim(full_name)) > 0
      and education_level is not null
      and field_of_study is not null
      and char_length(btrim(field_of_study)) > 0
      and skill_level is not null
      and weekly_study_time is not null
      and learning_style is not null
    )
  );
