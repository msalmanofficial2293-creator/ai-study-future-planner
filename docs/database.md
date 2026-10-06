# Database

Supabase PostgreSQL schema for AI Study Future Planner. The SQL lives in [supabase/migrations/20261006125000_database_foundation.sql](../supabase/migrations/20261006125000_database_foundation.sql). The Next.js app does not query these tables yet. Do not store student records in Markdown.

## Current decision

Supabase Auth identifies the student. This migration adds the application tables those later features will use. Apply the migration in the Supabase project before any feature writes study data. The app still uses only the public Supabase URL and publishable key. Do not add a service-role key.

Signup still saves `full_name` in Auth user metadata. After this migration is applied, `handle_new_user` copies that name into `profiles`. Existing Auth users are backfilled by the same migration.

## Access rules

- Every student table has row level security. A signed-in student can read and change only rows they own.
- `profiles.id` is the Auth user id. Every other student table has `user_id` referencing `auth.users`.
- Child rows also store `user_id`. A composite foreign key keeps that id the same as the parent row, so a student cannot attach their row to someone else's goal, roadmap, plan, or quiz.
- Queries belong in future server-side services. The browser must not open a database connection or receive a database password.
- Do not commit credentials, dumps, or real student data.
- Deleting the Auth user deletes the profile and owned rows through `ON DELETE CASCADE`.

## Tables

| Table | Owns | Purpose |
| --- | --- | --- |
| `profiles` | One row per Auth user | Display name copied from signup metadata. |
| `goals` | The student | The future outcome being studied. |
| `roadmaps` | One goal | An ordered path for that goal. One row per goal may be `is_current`. |
| `roadmap_milestones` | One roadmap | Ordered steps on a roadmap. |
| `study_plans` | One roadmap | A followable plan for that roadmap. One row per roadmap may be `is_current`. |
| `study_tasks` | One study plan | Work items, optionally scheduled on a day and linked to a milestone on the same roadmap. |
| `quizzes` | One study plan | Practice for that plan. An optional task must belong to the same plan. |
| `quiz_questions` | One quiz | Prompt, JSON choices, and the correct choice index. |
| `quiz_attempts` | One quiz | One sitting of a quiz, in progress or submitted. |
| `quiz_answers` | One attempt and one question | The selected choice and whether it was correct when it was saved. |
| `performance_records` | One goal | A dated snapshot of task counts, quiz score, and an optional consistency note. Tasks and attempts remain the source of those facts. |
| `adaptive_plans` | One study plan | A proposed revision of that plan, optionally tied to a performance snapshot. |

`quiz_answers` stores `created_at` only. The other tables store `created_at` and `updated_at`. `updated_at` is maintained by `set_updated_at`.

Primary keys are UUIDs. `profiles.id` is the Auth user id. Other primary keys default to `gen_random_uuid()`.

## Relationships

- `auth.users` 1 — 1 `profiles`. Deleting the user deletes the profile.
- `auth.users` 1 — many `goals`. Deleting the user deletes those goals.
- `goals` 1 — many `roadmaps`. Deleting a goal deletes its roadmaps.
- `roadmaps` 1 — many `roadmap_milestones`. Deleting a roadmap deletes its milestones.
- `roadmaps` 1 — many `study_plans`. Deleting a roadmap deletes its plans.
- `study_plans` 1 — many `study_tasks`. Deleting a plan deletes its tasks.
- `roadmap_milestones` 1 — many optional `study_tasks`. Deleting a milestone clears only `milestone_id`.
- `study_plans` 1 — many `quizzes`. Deleting a plan deletes its quizzes.
- `study_tasks` 1 — many optional `quizzes`. Deleting a task clears only `study_task_id`.
- `quizzes` 1 — many `quiz_questions` and many `quiz_attempts`.
- `quiz_attempts` 1 — many `quiz_answers`. Deleting an attempt deletes its answers.
- `quiz_questions` 1 — many `quiz_answers`. A question that already has answers cannot be deleted (`ON DELETE RESTRICT`).
- `goals` 1 — many `performance_records`. Deleting a goal deletes those snapshots.
- `study_plans` 1 — many optional `performance_records`. Deleting a plan clears only `study_plan_id`.
- `study_plans` 1 — many `adaptive_plans`. Deleting a plan deletes its adaptive rows.
- `performance_records` 1 — many optional `adaptive_plans`. Deleting a snapshot clears only `performance_record_id`.

Saving a roadmap or study plan with `is_current = true` clears that flag on the student's other current row for the same goal or roadmap. A task milestone must sit on the same roadmap as the task's plan. A quiz task must sit on the same plan as the quiz. An answer's question must belong to the attempt's quiz.

## Indexes

- `roadmaps_one_current_per_goal` — one current roadmap for each goal.
- `study_plans_one_current_per_roadmap` — one current study plan for each roadmap.
- `goals_user_id_idx`
- `roadmaps_user_id_idx`, `roadmaps_goal_id_idx`
- `roadmap_milestones_user_id_idx`, `roadmap_milestones_roadmap_id_idx` on `(roadmap_id, position)`, plus unique `(roadmap_id, position)`
- `study_plans_user_id_idx`, `study_plans_roadmap_id_idx`
- `study_tasks_user_id_idx`, `study_tasks_plan_day_idx` on `(study_plan_id, scheduled_on, position)`, plus unique `(study_plan_id, position)`
- `quizzes_user_id_idx`, `quizzes_study_plan_id_idx`
- `quiz_questions_user_id_idx`, plus unique `(quiz_id, position)`
- `quiz_attempts_user_id_idx`, `quiz_attempts_quiz_id_idx`
- `quiz_answers_user_id_idx`, `quiz_answers_question_id_idx`, plus unique `(attempt_id, question_id)`
- `performance_records_user_goal_day_idx` on `(user_id, goal_id, recorded_on)`
- `adaptive_plans_user_id_idx`, `adaptive_plans_study_plan_id_idx`

Each child table also has a unique `(id, user_id)` key so composite foreign keys can enforce the same owner. That key is the ownership link, not a second copy of the goal or plan text.

## Row level security

Row level security is enabled and forced on all twelve tables. The `anon` role has no privileges on them. There is no policy that selects every row.

`profiles` allows `authenticated` to select and update the row whose `id` is `auth.uid()`. Students cannot insert or delete profiles. The signup trigger inserts the row, and deleting the Auth user removes it.

Every other table allows `authenticated` to select, insert, update, and delete only where `user_id = auth.uid()`. Inserts and updates must also leave `user_id` equal to `auth.uid()`.

## Not built in this phase

No onboarding screen, goal editor, roadmap generator, study plan, task list, quiz, performance view, adaptive planner, or tutor. No application query layer. Study sessions and tutor conversations are not tables yet.

## Related documents

- [Architecture](architecture.md)
- [API](api.md)
- [Security](security.md)
- [Product](product.md)
- [README](../README.md)
