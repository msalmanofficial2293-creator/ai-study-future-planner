-- Database foundation for AI Study Future Planner.
-- Apply this in the Supabase SQL editor or with the Supabase CLI.
-- Do not put a service-role key in the application.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' constraint profiles_full_name_length check (char_length(full_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null constraint goals_title_not_blank check (char_length(btrim(title)) > 0),
  description text,
  status text not null default 'draft' constraint goals_status_check check (status in ('draft', 'active', 'completed', 'archived')),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_id_user_key unique (id, user_id)
);

create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  title text not null constraint roadmaps_title_not_blank check (char_length(btrim(title)) > 0),
  summary text,
  status text not null default 'draft' constraint roadmaps_status_check check (status in ('draft', 'ready', 'superseded')),
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roadmaps_goal_user_fkey foreign key (goal_id, user_id) references public.goals (id, user_id) on delete cascade,
  constraint roadmaps_id_user_key unique (id, user_id)
);

create table public.roadmap_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  roadmap_id uuid not null,
  position integer not null constraint roadmap_milestones_position_check check (position > 0),
  title text not null constraint roadmap_milestones_title_not_blank check (char_length(btrim(title)) > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roadmap_milestones_roadmap_user_fkey foreign key (roadmap_id, user_id) references public.roadmaps (id, user_id) on delete cascade,
  constraint roadmap_milestones_id_user_key unique (id, user_id),
  constraint roadmap_milestones_order_key unique (roadmap_id, position)
);

create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  roadmap_id uuid not null,
  title text not null constraint study_plans_title_not_blank check (char_length(btrim(title)) > 0),
  summary text,
  status text not null default 'draft' constraint study_plans_status_check check (status in ('draft', 'active', 'completed', 'superseded')),
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_plans_roadmap_user_fkey foreign key (roadmap_id, user_id) references public.roadmaps (id, user_id) on delete cascade,
  constraint study_plans_id_user_key unique (id, user_id)
);

create table public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  study_plan_id uuid not null,
  milestone_id uuid,
  title text not null constraint study_tasks_title_not_blank check (char_length(btrim(title)) > 0),
  details text,
  scheduled_on date,
  position integer not null default 1 constraint study_tasks_position_check check (position > 0),
  status text not null default 'pending' constraint study_tasks_status_check check (status in ('pending', 'completed', 'skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_tasks_plan_user_fkey foreign key (study_plan_id, user_id) references public.study_plans (id, user_id) on delete cascade,
  constraint study_tasks_milestone_user_fkey foreign key (milestone_id, user_id) references public.roadmap_milestones (id, user_id) on delete set null (milestone_id),
  constraint study_tasks_id_user_key unique (id, user_id),
  constraint study_tasks_plan_position_key unique (study_plan_id, position),
  constraint study_tasks_completed_at_check check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  study_plan_id uuid not null,
  study_task_id uuid,
  title text not null constraint quizzes_title_not_blank check (char_length(btrim(title)) > 0),
  status text not null default 'draft' constraint quizzes_status_check check (status in ('draft', 'ready', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quizzes_plan_user_fkey foreign key (study_plan_id, user_id) references public.study_plans (id, user_id) on delete cascade,
  constraint quizzes_task_user_fkey foreign key (study_task_id, user_id) references public.study_tasks (id, user_id) on delete set null (study_task_id),
  constraint quizzes_id_user_key unique (id, user_id)
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id uuid not null,
  position integer not null constraint quiz_questions_position_check check (position > 0),
  prompt text not null constraint quiz_questions_prompt_not_blank check (char_length(btrim(prompt)) > 0),
  choices jsonb not null constraint quiz_questions_choices_check check (
    jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) >= 2
  ),
  correct_index smallint not null constraint quiz_questions_correct_index_check check (
    correct_index >= 0 and correct_index < jsonb_array_length(choices)
  ),
  explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_questions_quiz_user_fkey foreign key (quiz_id, user_id) references public.quizzes (id, user_id) on delete cascade,
  constraint quiz_questions_id_user_key unique (id, user_id),
  constraint quiz_questions_order_key unique (quiz_id, position)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id uuid not null,
  status text not null default 'in_progress' constraint quiz_attempts_status_check check (status in ('in_progress', 'submitted')),
  score numeric(5, 2) constraint quiz_attempts_score_check check (score is null or (score >= 0 and score <= 100)),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_attempts_quiz_user_fkey foreign key (quiz_id, user_id) references public.quizzes (id, user_id) on delete cascade,
  constraint quiz_attempts_id_user_key unique (id, user_id),
  constraint quiz_attempts_submitted_check check (
    (status = 'submitted' and submitted_at is not null and score is not null)
    or (status = 'in_progress' and submitted_at is null and score is null)
  )
);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  attempt_id uuid not null,
  question_id uuid not null,
  selected_index smallint not null constraint quiz_answers_selected_index_check check (selected_index >= 0),
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  constraint quiz_answers_attempt_user_fkey foreign key (attempt_id, user_id) references public.quiz_attempts (id, user_id) on delete cascade,
  constraint quiz_answers_question_user_fkey foreign key (question_id, user_id) references public.quiz_questions (id, user_id) on delete restrict,
  constraint quiz_answers_attempt_question_key unique (attempt_id, question_id)
);

create table public.performance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  study_plan_id uuid,
  recorded_on date not null default current_date,
  tasks_completed integer not null default 0 constraint performance_records_tasks_completed_check check (tasks_completed >= 0),
  tasks_total integer not null default 0 constraint performance_records_tasks_total_check check (tasks_total >= 0),
  quizzes_taken integer not null default 0 constraint performance_records_quizzes_taken_check check (quizzes_taken >= 0),
  average_score numeric(5, 2) constraint performance_records_average_score_check check (
    average_score is null or (average_score >= 0 and average_score <= 100)
  ),
  summary text,
  consistency_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint performance_records_goal_user_fkey foreign key (goal_id, user_id) references public.goals (id, user_id) on delete cascade,
  constraint performance_records_plan_user_fkey foreign key (study_plan_id, user_id) references public.study_plans (id, user_id) on delete set null (study_plan_id),
  constraint performance_records_id_user_key unique (id, user_id),
  constraint performance_records_task_counts_check check (tasks_completed <= tasks_total)
);

create table public.adaptive_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  study_plan_id uuid not null,
  performance_record_id uuid,
  rationale text,
  status text not null default 'draft' constraint adaptive_plans_status_check check (status in ('draft', 'applied', 'discarded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint adaptive_plans_plan_user_fkey foreign key (study_plan_id, user_id) references public.study_plans (id, user_id) on delete cascade,
  constraint adaptive_plans_record_user_fkey foreign key (performance_record_id, user_id) references public.performance_records (id, user_id) on delete set null (performance_record_id)
);

create unique index roadmaps_one_current_per_goal
  on public.roadmaps (goal_id)
  where is_current;

create unique index study_plans_one_current_per_roadmap
  on public.study_plans (roadmap_id)
  where is_current;

create index goals_user_id_idx on public.goals (user_id);
create index roadmaps_user_id_idx on public.roadmaps (user_id);
create index roadmaps_goal_id_idx on public.roadmaps (goal_id);
create index roadmap_milestones_user_id_idx on public.roadmap_milestones (user_id);
create index roadmap_milestones_roadmap_id_idx on public.roadmap_milestones (roadmap_id, position);
create index study_plans_user_id_idx on public.study_plans (user_id);
create index study_plans_roadmap_id_idx on public.study_plans (roadmap_id);
create index study_tasks_user_id_idx on public.study_tasks (user_id);
create index study_tasks_plan_day_idx on public.study_tasks (study_plan_id, scheduled_on, position);
create index quizzes_user_id_idx on public.quizzes (user_id);
create index quizzes_study_plan_id_idx on public.quizzes (study_plan_id);
create index quiz_questions_user_id_idx on public.quiz_questions (user_id);
create index quiz_attempts_user_id_idx on public.quiz_attempts (user_id);
create index quiz_attempts_quiz_id_idx on public.quiz_attempts (quiz_id);
create index quiz_answers_user_id_idx on public.quiz_answers (user_id);
create index quiz_answers_question_id_idx on public.quiz_answers (question_id);
create index performance_records_user_goal_day_idx on public.performance_records (user_id, goal_id, recorded_on);
create index adaptive_plans_user_id_idx on public.adaptive_plans (user_id);
create index adaptive_plans_study_plan_id_idx on public.adaptive_plans (study_plan_id);

create or replace function public.clear_previous_current_roadmap()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_current then
    update public.roadmaps
    set is_current = false
    where goal_id = new.goal_id
      and user_id = new.user_id
      and id is distinct from new.id
      and is_current;
  end if;
  return new;
end;
$$;

create or replace function public.clear_previous_current_study_plan()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_current then
    update public.study_plans
    set is_current = false
    where roadmap_id = new.roadmap_id
      and user_id = new.user_id
      and id is distinct from new.id
      and is_current;
  end if;
  return new;
end;
$$;

create or replace function public.assert_task_milestone_matches_plan()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  plan_roadmap uuid;
  milestone_roadmap uuid;
begin
  if new.milestone_id is null then
    return new;
  end if;

  select roadmap_id into plan_roadmap
  from public.study_plans
  where id = new.study_plan_id
    and user_id = new.user_id;

  select roadmap_id into milestone_roadmap
  from public.roadmap_milestones
  where id = new.milestone_id
    and user_id = new.user_id;

  if plan_roadmap is null or milestone_roadmap is distinct from plan_roadmap then
    raise exception 'study task milestone must belong to the same roadmap as the study plan';
  end if;

  return new;
end;
$$;

create or replace function public.assert_quiz_task_matches_plan()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  task_plan uuid;
begin
  if new.study_task_id is null then
    return new;
  end if;

  select study_plan_id into task_plan
  from public.study_tasks
  where id = new.study_task_id
    and user_id = new.user_id;

  if task_plan is distinct from new.study_plan_id then
    raise exception 'quiz task must belong to the same study plan as the quiz';
  end if;

  return new;
end;
$$;

create or replace function public.assert_answer_question_matches_attempt()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  attempt_quiz uuid;
  question_quiz uuid;
begin
  select quiz_id into attempt_quiz
  from public.quiz_attempts
  where id = new.attempt_id
    and user_id = new.user_id;

  select quiz_id into question_quiz
  from public.quiz_questions
  where id = new.question_id
    and user_id = new.user_id;

  if attempt_quiz is null or question_quiz is distinct from attempt_quiz then
    raise exception 'quiz answer must use a question from the same quiz as the attempt';
  end if;

  return new;
end;
$$;

revoke all on function public.clear_previous_current_roadmap() from public, anon, authenticated;
revoke all on function public.clear_previous_current_study_plan() from public, anon, authenticated;
revoke all on function public.assert_task_milestone_matches_plan() from public, anon, authenticated;
revoke all on function public.assert_quiz_task_matches_plan() from public, anon, authenticated;
revoke all on function public.assert_answer_question_matches_attempt() from public, anon, authenticated;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

create trigger roadmaps_set_updated_at
  before update on public.roadmaps
  for each row execute function public.set_updated_at();

create trigger roadmaps_clear_previous_current
  before insert or update of is_current, goal_id, user_id on public.roadmaps
  for each row execute function public.clear_previous_current_roadmap();

create trigger roadmap_milestones_set_updated_at
  before update on public.roadmap_milestones
  for each row execute function public.set_updated_at();

create trigger study_plans_set_updated_at
  before update on public.study_plans
  for each row execute function public.set_updated_at();

create trigger study_plans_clear_previous_current
  before insert or update of is_current, roadmap_id, user_id on public.study_plans
  for each row execute function public.clear_previous_current_study_plan();

create trigger study_tasks_set_updated_at
  before update on public.study_tasks
  for each row execute function public.set_updated_at();

create trigger study_tasks_milestone_matches_plan
  before insert or update of milestone_id, study_plan_id, user_id on public.study_tasks
  for each row execute function public.assert_task_milestone_matches_plan();

create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

create trigger quizzes_task_matches_plan
  before insert or update of study_task_id, study_plan_id, user_id on public.quizzes
  for each row execute function public.assert_quiz_task_matches_plan();

create trigger quiz_questions_set_updated_at
  before update on public.quiz_questions
  for each row execute function public.set_updated_at();

create trigger quiz_attempts_set_updated_at
  before update on public.quiz_attempts
  for each row execute function public.set_updated_at();

create trigger quiz_answers_question_matches_attempt
  before insert or update of attempt_id, question_id, user_id on public.quiz_answers
  for each row execute function public.assert_answer_question_matches_attempt();

create trigger performance_records_set_updated_at
  before update on public.performance_records
  for each row execute function public.set_updated_at();

create trigger adaptive_plans_set_updated_at
  before update on public.adaptive_plans
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80));
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name)
select id, left(coalesce(raw_user_meta_data ->> 'full_name', ''), 80)
from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.roadmaps enable row level security;
alter table public.roadmap_milestones enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_tasks enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.performance_records enable row level security;
alter table public.adaptive_plans enable row level security;

alter table public.profiles force row level security;
alter table public.goals force row level security;
alter table public.roadmaps force row level security;
alter table public.roadmap_milestones force row level security;
alter table public.study_plans force row level security;
alter table public.study_tasks force row level security;
alter table public.quizzes force row level security;
alter table public.quiz_questions force row level security;
alter table public.quiz_attempts force row level security;
alter table public.quiz_answers force row level security;
alter table public.performance_records force row level security;
alter table public.adaptive_plans force row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy goals_select on public.goals
  for select to authenticated using (user_id = (select auth.uid()));
create policy goals_insert on public.goals
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy goals_update on public.goals
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy goals_delete on public.goals
  for delete to authenticated using (user_id = (select auth.uid()));

create policy roadmaps_select on public.roadmaps
  for select to authenticated using (user_id = (select auth.uid()));
create policy roadmaps_insert on public.roadmaps
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy roadmaps_update on public.roadmaps
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy roadmaps_delete on public.roadmaps
  for delete to authenticated using (user_id = (select auth.uid()));

create policy roadmap_milestones_select on public.roadmap_milestones
  for select to authenticated using (user_id = (select auth.uid()));
create policy roadmap_milestones_insert on public.roadmap_milestones
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy roadmap_milestones_update on public.roadmap_milestones
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy roadmap_milestones_delete on public.roadmap_milestones
  for delete to authenticated using (user_id = (select auth.uid()));

create policy study_plans_select on public.study_plans
  for select to authenticated using (user_id = (select auth.uid()));
create policy study_plans_insert on public.study_plans
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy study_plans_update on public.study_plans
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy study_plans_delete on public.study_plans
  for delete to authenticated using (user_id = (select auth.uid()));

create policy study_tasks_select on public.study_tasks
  for select to authenticated using (user_id = (select auth.uid()));
create policy study_tasks_insert on public.study_tasks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy study_tasks_update on public.study_tasks
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy study_tasks_delete on public.study_tasks
  for delete to authenticated using (user_id = (select auth.uid()));

create policy quizzes_select on public.quizzes
  for select to authenticated using (user_id = (select auth.uid()));
create policy quizzes_insert on public.quizzes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy quizzes_update on public.quizzes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy quizzes_delete on public.quizzes
  for delete to authenticated using (user_id = (select auth.uid()));

create policy quiz_questions_select on public.quiz_questions
  for select to authenticated using (user_id = (select auth.uid()));
create policy quiz_questions_insert on public.quiz_questions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy quiz_questions_update on public.quiz_questions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy quiz_questions_delete on public.quiz_questions
  for delete to authenticated using (user_id = (select auth.uid()));

create policy quiz_attempts_select on public.quiz_attempts
  for select to authenticated using (user_id = (select auth.uid()));
create policy quiz_attempts_insert on public.quiz_attempts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy quiz_attempts_update on public.quiz_attempts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy quiz_attempts_delete on public.quiz_attempts
  for delete to authenticated using (user_id = (select auth.uid()));

create policy quiz_answers_select on public.quiz_answers
  for select to authenticated using (user_id = (select auth.uid()));
create policy quiz_answers_insert on public.quiz_answers
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy quiz_answers_update on public.quiz_answers
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy quiz_answers_delete on public.quiz_answers
  for delete to authenticated using (user_id = (select auth.uid()));

create policy performance_records_select on public.performance_records
  for select to authenticated using (user_id = (select auth.uid()));
create policy performance_records_insert on public.performance_records
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy performance_records_update on public.performance_records
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy performance_records_delete on public.performance_records
  for delete to authenticated using (user_id = (select auth.uid()));

create policy adaptive_plans_select on public.adaptive_plans
  for select to authenticated using (user_id = (select auth.uid()));
create policy adaptive_plans_insert on public.adaptive_plans
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy adaptive_plans_update on public.adaptive_plans
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy adaptive_plans_delete on public.adaptive_plans
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on table public.profiles from anon, public;
revoke all on table public.goals from anon, public;
revoke all on table public.roadmaps from anon, public;
revoke all on table public.roadmap_milestones from anon, public;
revoke all on table public.study_plans from anon, public;
revoke all on table public.study_tasks from anon, public;
revoke all on table public.quizzes from anon, public;
revoke all on table public.quiz_questions from anon, public;
revoke all on table public.quiz_attempts from anon, public;
revoke all on table public.quiz_answers from anon, public;
revoke all on table public.performance_records from anon, public;
revoke all on table public.adaptive_plans from anon, public;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.goals to authenticated;
grant select, insert, update, delete on table public.roadmaps to authenticated;
grant select, insert, update, delete on table public.roadmap_milestones to authenticated;
grant select, insert, update, delete on table public.study_plans to authenticated;
grant select, insert, update, delete on table public.study_tasks to authenticated;
grant select, insert, update, delete on table public.quizzes to authenticated;
grant select, insert, update, delete on table public.quiz_questions to authenticated;
grant select, insert, update, delete on table public.quiz_attempts to authenticated;
grant select, insert, update, delete on table public.quiz_answers to authenticated;
grant select, insert, update, delete on table public.performance_records to authenticated;
grant select, insert, update, delete on table public.adaptive_plans to authenticated;
