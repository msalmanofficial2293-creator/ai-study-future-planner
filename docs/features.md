# Features

What exists today, and what is specified for later. Planned items are not implemented. Do not scaffold their screens, routes, or sample data ahead of a task that asks for them.

Terminology matches [product.md](product.md). The journey is:

Goal → AI Future Roadmap → Study Plan → Daily Tasks → AI Quiz → Performance Tracking → Adaptive Study Plan → AI Tutor

## Implemented

### Landing page

- Purpose: introduce AI Study Future Planner and the learning journey.
- User value: a student can understand the product before study tools or AI exist.
- Expected behavior: the home page shows the product name, the sequence from Goal through AI Tutor, and the study approach. In-page links move to those sections. The header and footer stay available.
- Important states: the page is static content. Unknown URLs use the not-found page. Unexpected render failures use the error page and a retry action. There is no data-loading or empty-data state.
- Dependencies: none beyond the application shell.
- Future implementation notes: do not turn this page into a dashboard or attach fake generation actions.

### Application foundation

- Purpose: give later features a typed, styled, documented shell.
- User value: the public site loads, and later work has a stable structure.
- Expected behavior: `npm run dev` serves the site. `npm run lint`, `npm run typecheck`, and `npm run build` are the current checks.
- Important states: configuration fails fast when `NEXT_PUBLIC_APP_URL` is set to a value that is not an absolute `http` or `https` URL. If it is unset, local development uses `http://localhost:3000`.
- Dependencies: Node.js 20 or newer and npm.
- Future implementation notes: add feature folders, services, and API routes only when a feature needs them. See [architecture.md](architecture.md).

### Authentication

- Purpose: identify a student before the product stores personal study data.
- User value: the student can create an account and return to it.
- Expected behavior: a student can sign up with full name, email, and password, log in, and log out. The server reads the session from Supabase auth cookies. `/app` is a temporary verification page that shows the product name, a welcome, the signed-in email, links to the profile and Future Planner, and a logout button. Anonymous visitors to `/app` or `/onboarding` are redirected to `/login`. A signed-in student who still needs onboarding is sent to `/onboarding` from login, signup, and the auth callback. A student whose `profiles.onboarding_completed_at` is set is sent to `/app`. `/auth/callback` exchanges the auth code for a session.
- Important states: field validation, loading, invalid credentials, email already registered, weak password, unexpected failure, and email confirmation. When confirmation is required, signup stays on the form and tells the student to check their email. It does not open `/app` without a session.
- Dependencies: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and Supabase Auth. No secret or service-role key is used. See [security.md](security.md) and [architecture.md](architecture.md).
- Future implementation notes: password recovery and account deletion are not implemented. Signup still stores `full_name` in user metadata, and the database trigger copies it into `profiles`. `/app` is not the product dashboard.

### User onboarding

- Purpose: collect the context for a student's first Goal.
- User value: a signed-in student can save who they are and the future they are studying toward.
- Expected behavior: `/onboarding` is available only to a signed-in student. The form asks for full name, education level, field or major, current skill level, career goal, target outcome, available weekly study time, and preferred learning style. Required fields are checked again on the server. Saving updates that student's `profiles` row and creates or updates their first `goals` row. Success redirects to `/app`. A student who already finished onboarding is sent to `/app` instead of seeing the form again.
- Important states: first visit, already completed, validation errors, save failure, a profile that is not ready, and loading. The submit control stays disabled while the save is in progress, and a second submit is ignored.
- Dependencies: Authentication, the applied database migrations, and the student's own row level security policies. No service-role key is used.
- Future implementation notes: this is not the Future Planner. Roadmaps, study plans, tasks, quizzes, and tutoring are not created.

### Future Planner

- Purpose: the place a student sees and revises the Goal collected during onboarding.
- User value: the student can confirm the destination and generate a roadmap from it.
- Expected behavior: `/app/future-planner` is available only to a signed-in student who has finished onboarding. It shows the current career goal, target outcome, education level, field of study, skill level, weekly study time, and learning style. The student can update the career goal and target outcome. The save writes that student's earliest `goals` row, or inserts one if none exists. Profile context is read from `profiles` and is not edited here. "Generate My AI Future Roadmap" asks the server for a development roadmap and saves it for that student.
- Important states: loading, no goal yet, saved, validation error, save failure, and a failure to load the student's records. The submit control stays disabled while the save is in progress, and a second submit is ignored.
- Dependencies: Authentication, completed onboarding, and the existing row level security policies. No service-role key is used.
- Future implementation notes: keep the object name Goal. Do not rename it to a roadmap or a plan.

### AI Future Roadmap

- Purpose: turn a Goal into an ordered path of skills and milestones.
- User value: the student can see how the goal breaks into stages.
- Expected behavior: on Future Planner, "Generate My AI Future Roadmap" runs a server-side development generator. It reads the student's career goal, target outcome, education level, field of study, skill level, weekly study time, and learning style. It does not call OpenAI or any other paid provider. The result is validated, then stored in the existing `roadmaps` and `roadmap_milestones` tables for that student. The page shows the title, overview, timeline, stages, skills, milestones, and next steps. Refreshing the page shows the saved current roadmap. A later model can replace `createRoadmapGenerator()` without changing the page or the tables.
- Important states: no roadmap yet, generating, saved, empty, load failure, and save failure. The button stays disabled while generation is in progress, and a second submit is ignored. The button is also disabled when there is no career goal.
- Dependencies: a saved Goal, completed onboarding, and the existing row level security policies. No new table and no API key are used.
- Future implementation notes: the browser must not call a provider. The OpenAI connectivity check is not this generator. Do not store a roadmap when validation fails.

### AI integration foundation

- Purpose: give later study features a server-side OpenAI client.
- User value: a signed-in student can confirm the provider is reachable without generating a study plan.
- Expected behavior: `POST /api/ai/test` requires the existing Supabase session. The body is a short `message`. The server calls the OpenAI Responses API and returns one short confirmation, or a safe error. A missing `OPENAI_API_KEY` returns a clear configuration error and does not crash the app. The Future Planner button does not call this route.
- Important states: unauthenticated, invalid input, missing key, invalid configuration, local rate limit, provider rate limit, timeout, provider failure, and success.
- Dependencies: `OPENAI_API_KEY`, optional `OPENAI_MODEL`, and the existing session check. No new table is used.
- Future implementation notes: roadmap, plan, quiz, and tutor generation are not this check. Do not store the reply as study content.

### Profile

- Purpose: let a signed-in student see and update the identity and study context already stored for them.
- User value: the student can correct their name, learning context, and goal without starting over.
- Expected behavior: `/app/profile` is available only to a signed-in student. The header shows initials, full name, username, email, and bio, with Edit Profile. Personal information, education and learning, and career and goals can be edited and saved. Email is read-only. Save writes that student's `profiles` row and the earliest `goals` row, or inserts a goal if none exists. Username, bio, and interests live on `profiles`. Cancel leaves the saved values in place. The account section can change the password and save notification preferences. Logout uses the existing sign-out action. Delete account explains that deletion is not available and does not remove anything. A signed-in header and menu include a Profile link.
- Important states: loading, not set yet, editing, saving, saved, validation error, username already taken, save failure, password failure, and a profile row that is not ready. Save controls stay disabled while a request is in progress, and a second submit is ignored.
- Dependencies: Authentication, the profile account migration, and the existing row level security policies. No service-role key and no storage bucket are used.
- Future implementation notes: password recovery, account deletion, and photo upload are not implemented. The delete control is a placeholder.

### Study Plan

- Purpose: turn the current roadmap into tasks the student can follow.
- User value: the student can see the current stage, weekly target, and the tasks for this week.
- Expected behavior: `/app/study-plan` is available only to a signed-in student who has finished onboarding. It loads that student's current roadmap and milestones. It shows the roadmap, current learning stage, weekly study target, subjects, planned study time, the related milestone, and weekly progress. The student can add, edit, complete, reopen, and delete tasks. The first task creates the current `study_plans` row for that roadmap. Tasks are stored in `study_tasks`. Skill and estimated duration are kept in `details` because the table has no separate columns for them. The page does not call a paid AI provider and does not adapt the plan.
- Important states: loading, no roadmap yet, no tasks yet, saving, saved, validation error, save failure, and a failure to load the student's records. Submit controls stay disabled while a request is in progress.
- Dependencies: a saved current roadmap, completed onboarding, and the existing row level security policies. No new table and no API key are used.
- Future implementation notes: the adaptive page can add tasks to this plan. Do not create a second plan table.

### Daily Tasks

- Purpose: show the current study plan as the work for a day.
- User value: the student can see what is due today, what is later, and what is already complete.
- Expected behavior: `/app/daily-tasks` is available only to a signed-in student who has finished onboarding. It loads that student's current study plan and `study_tasks` rows. It shows today's tasks, upcoming tasks, and completed tasks, with title, description, skill, duration, planned date, status, the study plan, and the roadmap milestone when one is linked. The student can add a task for a chosen date, view details, edit, delete, and mark a task complete or incomplete. Daily progress is completed tasks planned for today divided by every task planned for today. Saving uses the existing study plan actions and tables. The page does not call a paid AI provider and does not adapt the plan.
- Important states: loading, no roadmap yet, nothing due today, saving, saved, validation error, save failure, and a failure to load the student's records. Submit controls stay disabled while a request is in progress.
- Dependencies: the current study plan data, completed onboarding, and the existing row level security policies. No new table and no API key are used.
- Future implementation notes: the adaptive page can add tasks to this list. Do not create a second task table.

### AI Quiz

- Purpose: check understanding of the current roadmap and study plan.
- User value: the student can practice a skill, see the score, and review each answer.
- Expected behavior: `/app/quiz` is available only to a signed-in student who has finished onboarding. It lists that student's ready quizzes and submitted attempts. Creating a quiz runs a server-side development generator from the current roadmap skills and study tasks. It does not call a paid AI provider. Each quiz is stored in `quizzes` and `quiz_questions` on the current study plan. Starting a quiz creates a `quiz_attempts` row. The student answers one question at a time, then submits. The server scores the answers, stores each one in `quiz_answers`, saves the percentage on the attempt, and writes a `performance_records` snapshot for the goal. The result shows the score, percentage, correct count, incorrect count, total, and a review with explanations. Refreshing keeps the attempt in quiz history. The page does not revise the study plan.
- Important states: loading, no roadmap yet, no study plan yet, no quizzes yet, creating, in progress, submitting, saved result, validation error, save failure, and a failure to load the student's records.
- Dependencies: a current study plan, completed onboarding, and the existing row level security policies. No new table and no API key are used.
- Future implementation notes: model quiz generation can replace `createQuizGenerator()` later.

### Performance Tracking

- Purpose: show progress, gaps, and consistency from saved work.
- User value: the student can see whether tasks and quizzes are moving the Goal forward.
- Expected behavior: `/app/performance` is available only to a signed-in student who has finished onboarding. It reads that student's quiz attempts, quiz answers, performance snapshots, study tasks, study plans, and roadmap milestones. It shows overall progress, average quiz score, quizzes completed, tasks completed, task completion, current plan progress, a quiz score trend, task completion by milestone, strong and weak skills from saved answers, recent quiz results, recent activity, and the latest performance snapshots. Figures are calculated from stored rows. If no task is complete and no quiz is submitted, the page shows an empty state. Submitting a quiz already writes a `performance_records` snapshot. Marking a task complete or incomplete writes another snapshot and does not change the task screens. The page does not call a paid AI provider and does not revise the study plan.
- Important states: loading, not enough saved work, progress loaded, and a failure to load the student's records.
- Dependencies: Daily Tasks, AI Quiz attempts, and the existing row level security policies. No new table and no API key are used.
- Future implementation notes: the adaptive page reads this evidence. This view does not revise the plan.

### Adaptive Study Plan

- Purpose: change later study when performance shows what needs attention.
- User value: the student can see what to revise, what to keep, and what to do next.
- Expected behavior: `/app/adaptive-plan` is available only to a signed-in student who has finished onboarding. It reads that student's quiz attempts, quiz answers, study tasks, study plan, roadmap milestones, and the latest performance snapshot. Rules on the server classify each skill with saved answers: below 50% adds a revision task, 50% to 79% keeps the topic and adds targeted practice, and 80% or above skips another repeat and recommends the next roadmap skill. The page shows current status, weak areas, strong areas, recommended changes, updated priorities, and the next tasks. Saving writes a draft `adaptive_plans` row. Applying adds the missing tasks to the current `study_tasks` rows and marks that adaptive plan applied. Refreshing keeps the saved row and the new tasks. The page does not call a paid AI provider. If no quiz answers are saved, it explains that a quiz is needed and does not invent recommendations.
- Important states: loading, no roadmap yet, no study plan yet, not enough quiz evidence, recommendation ready, saved, applied, already on the plan, and a failure to load or save.
- Dependencies: Performance Tracking evidence, the current study plan, and the existing row level security policies. No new table and no API key are used.
- Future implementation notes: a paid model can replace these rules later. Keep the revised tasks on the same study plan.

### AI Tutor

- Purpose: answer the student in the context of their Goal and recent work.
- User value: guidance stays on the learning journey instead of becoming a general chat.
- Expected behavior: `/app/ai-tutor` is available only to a signed-in student who has finished onboarding. The page shows the career goal, current roadmap stage, and current study focus. The student can start a chat, reopen it, rename it, clear its messages, or delete it. A question is saved as a `user` message. The server builds a short context from that student's profile, goal, roadmap, study plan, tasks, quizzes, and performance, then `createTutorGenerator()` writes a local reply and saves it as an `assistant` message. The reply uses short explanation, key points, example, practice, and next step. If a fact is not saved, the tutor says so and does not invent a score. Refresh keeps the conversation. This page does not call a paid AI provider and does not read `OPENAI_API_KEY`.
- Important states: loading, empty conversation, waiting for a reply, reply shown, renamed, cleared, deleted, missing conversation, and a failure to load or save.
- Dependencies: Authentication, the student's saved study rows, `tutor_conversations`, `tutor_messages`, and row level security. No API key is used.
- Future implementation notes: replace `createTutorGenerator()` with a call through `src/services/ai.ts` when a later task turns on a paid model. Keep context building, storage, and the page separate from that generator. Tutor context also reads the rule-based personalization summary when quiz evidence exists.

### AI Personalization

- Purpose: turn the student's saved profile, roadmap, plan, tasks, and quiz results into structured study recommendations.
- User value: the student sees why a focus, difficulty, or next step was chosen, and stays in control before anything is added to the plan.
- Expected behavior: `/app/personalization` is available only to a signed-in student who has finished onboarding. The server loads that student's profile, goal, roadmap, milestones, study plan, tasks, submitted quiz answers, and saved personalization decisions. Rules that match Adaptive Study Plan bands (below 50%, 50% to 79%, 80% or above) build a structured result: current focus, strong areas, weak areas, priority, difficulty, learning approach, next step, career alignment, reasoning, and actionable recommendations. Applying a recommendation can add a matching `study_tasks` row when the recommendation includes a task. Dismissing stores a decision so that fingerprint stays dismissed. Refresh reloads the analysis. If no submitted quiz answers exist, the page shows an empty state and does not invent scores. This page does not call a paid AI provider.
- Important states: loading, no roadmap, no study plan, insufficient quiz evidence, recommendation ready, applied, dismissed, refreshed, and a failure to load or save.
- Dependencies: Authentication, existing study tables, `personalization_decisions` for apply/dismiss only, and row level security. No API key is used.
- Future implementation notes: keep `buildPersonalization()` structured so a later paid model can consume the same result. Do not silently rewrite the study plan.

## Planned

### Account settings

- Purpose: account controls beyond the profile page.
- User value: the student can recover access and remove the account.
- Expected behavior: password recovery for a student who cannot sign in, and account deletion, as described in [security.md](security.md). Changing a password while signed in is already on the profile page. Photo upload is not part of the profile page.
- Important states: recovery sent, signed out, and deletion pending or failed.
- Dependencies: Authentication and the database.
- Future implementation notes: do not collect fields that no current feature uses.

## Related documents

- [Product](product.md)
- [Architecture](architecture.md)
- [AI system](ai-system.md)
- [README](../README.md)
