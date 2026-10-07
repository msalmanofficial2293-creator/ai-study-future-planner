# Database

Supabase PostgreSQL schema for AI Study Future Planner. The SQL lives in [supabase/migrations/20261006125000_database_foundation.sql](../supabase/migrations/20261006125000_database_foundation.sql). The Next.js app reads and writes `profiles` and the student's first `goals` row during onboarding, in the Future Planner, and on the profile page. Future Planner also reads and writes that student's `roadmaps` and `roadmap_milestones` rows. Study Plan reads that roadmap and writes `study_plans` and `study_tasks`. It does not query the other study tables yet. Do not store student records in Markdown.

## Current decision

Supabase Auth identifies the student. This migration adds the application tables those later features will use. Apply the migration in the Supabase project before any feature writes study data. The app still uses only the public Supabase URL and publishable key. Do not add a service-role key.

Signup still saves `full_name` in Auth user metadata. After the foundation migration is applied, `handle_new_user` copies that name into `profiles`. Existing Auth users are backfilled by that migration.

Onboarding then updates the same profile. Apply [supabase/migrations/20261006143000_onboarding_profile.sql](../supabase/migrations/20261006143000_onboarding_profile.sql) after the foundation migration. It adds learner context to `profiles`. It does not add a second profile table.

The profile page also stores username, bio, interests, and notification preferences on that same row. Apply [supabase/migrations/20261007120000_profile_account_fields.sql](../supabase/migrations/20261007120000_profile_account_fields.sql) after the onboarding migration. It does not add a table or change the profile policies.

AI Tutor stores conversations in `tutor_conversations` and messages in `tutor_messages`. Apply [supabase/migrations/20261007213000_tutor_conversations.sql](../supabase/migrations/20261007213000_tutor_conversations.sql) after the profile migration. A message can only reference a conversation owned by the same student. Roles are `user` and `assistant`.

## Access rules

- Every student table has row level security. A signed-in student can read and change only rows they own.
- `profiles.id` is the Auth user id. Every other student table has `user_id` referencing `auth.users`.
- Child rows also store `user_id`. A composite foreign key keeps that id the same as the parent row, so a student cannot attach their row to someone else's goal, roadmap, plan, or quiz.
- Queries for onboarding run in `src/services/onboarding.ts`. The Future Planner and the profile page read the same profile and first goal. The Future Planner updates the goal and can save a roadmap for it. The profile page updates that profile and the goal. Email stays on the Auth user and is not written to `profiles`. The browser must not open a database connection or receive a database password.
- Do not commit credentials, dumps, or real student data.
- Deleting the Auth user deletes the profile and owned rows through `ON DELETE CASCADE`.

## Tables

| Table | Owns | Purpose |
| --- | --- | --- |
| `profiles` | One row per Auth user | Display name, username, bio, learner context, interests, notification preferences, and whether onboarding is complete. |
| `goals` | The student | The future outcome being studied. Onboarding stores the career goal in `title` and the target outcome in `description`. |
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
| `tutor_conversations` | The student | One tutor chat, with a title. |
| `tutor_messages` | One tutor conversation | A `user` or `assistant` message. The content is the message only. |

`quiz_answers` and `tutor_messages` store `created_at` only. The other tables store `created_at` and `updated_at`. `updated_at` is maintained by `set_updated_at`.

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
- `auth.users` 1 — many `tutor_conversations`. Deleting the user deletes those conversations.
- `tutor_conversations` 1 — many `tutor_messages`. Deleting a conversation deletes its messages. The message must use the same `user_id` as the conversation.

Saving a roadmap or study plan with `is_current = true` clears that flag on the student's other current row for the same goal or roadmap. A task milestone must sit on the same roadmap as the task's plan. A quiz task must sit on the same plan as the quiz. An answer's question must belong to the attempt's quiz.

## Onboarding columns

`profiles` keeps one row per student. The onboarding migration adds:

| Column | Form field | Stored value |
| --- | --- | --- |
| `full_name` | Full name | Text, at most 80 characters. Already present. |
| `education_level` | Education level | `secondary`, `undergraduate`, `graduate`, `bootcamp`, `professional`, or `other`. |
| `field_of_study` | Field or major | Text, at most 120 characters. |
| `skill_level` | Current skill level | `beginner`, `intermediate`, or `advanced`. |
| `weekly_study_time` | Available study time | `under_5`, `5_to_10`, `10_to_20`, or `over_20`. |
| `learning_style` | Preferred learning style | `reading`, `practice`, `video`, or `mixed`. |
| `onboarding_completed_at` | None | Timestamp set when the save succeeds. Empty until then. |

A completed profile must have a name and every learner field. The career goal is `goals.title`. The target outcome is `goals.description`. Onboarding marks that goal `active`. A later save before completion updates the student's earliest goal instead of inserting another one.

The signed-in student updates only `profiles.id = auth.uid()` and inserts or updates only `goals.user_id = auth.uid()`. Those are the existing policies. Students still cannot insert or delete profile rows.

## Profile account columns

Apply `20261007120000_profile_account_fields.sql` after the onboarding migration. The new columns stay on `profiles`, so the existing select and update policies still limit each student to `id = auth.uid()`.

| Column | Form field | Stored value |
| --- | --- | --- |
| `username` | Username | Optional until the student saves a profile. Then 3 to 30 lowercase letters, numbers, or underscores. Unique. |
| `bio` | Bio | Optional text, at most 280 characters. |
| `interests` | Interests | Optional text, at most 200 characters. |
| `notify_study_reminders` | Study reminders | Boolean. Defaults to true. |
| `notify_product_updates` | Product updates | Boolean. Defaults to false. |

Email is not a profile column. Password changes use the signed-in Auth session and are not stored in `profiles`.

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

Row level security is enabled and forced on all fourteen tables. The `anon` role has no privileges on them. There is no policy that selects every row.

`profiles` allows `authenticated` to select and update the row whose `id` is `auth.uid()`. Students cannot insert or delete profiles. The signup trigger inserts the row, and deleting the Auth user removes it.

Every other table allows `authenticated` to select, insert, update, and delete only where `user_id = auth.uid()`. Inserts and updates must also leave `user_id` equal to `auth.uid()`.

## Not built in this phase

The Future Planner saves a development roadmap into `roadmaps` and `roadmap_milestones`. Study Plan and Daily Tasks save the current plan and its tasks into `study_plans` and `study_tasks`. Skill and estimated duration are stored in `study_tasks.details`. AI Quiz saves development quizzes into `quizzes` and `quiz_questions`, attempts into `quiz_attempts`, answers into `quiz_answers`, and a snapshot into `performance_records`. Topic and difficulty are stored in `quizzes.title` because that table has no separate columns for them. Performance Tracking reads those saved rows. Marking a task complete or incomplete also inserts a `performance_records` snapshot. Adaptive Study Plan stores a draft or applied recommendation in `adaptive_plans` and, when the student applies it, adds tasks to the current `study_tasks` rows. AI Tutor stores each conversation in `tutor_conversations` and each message in `tutor_messages`. The message row stores role and content only. It does not copy the profile, goal, or quiz. Study sessions are not a table.

## Related documents

- [Architecture](architecture.md)
- [API](api.md)
- [Security](security.md)
- [Product](product.md)
- [README](../README.md)
