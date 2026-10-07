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
- Future implementation notes: an Adaptive Study Plan is a later revision. Do not create a second plan table.

## Planned

### Daily Tasks

- Purpose: turn the Study Plan into focused work for a day.
- User value: the student knows what to do in the next session.
- Expected behavior: tasks belong to the current plan and can be viewed for a day. Completion is recorded for Performance Tracking.
- Important states: no tasks yet, today's list, completed, empty day, loading, and save failure.
- Dependencies: Study Plan and persistence.
- Future implementation notes: tasks are work items, not a second goal system.

### AI Quiz

- Purpose: check understanding of what the student just studied.
- User value: practice is tied to recent work instead of an unrelated question bank.
- Expected behavior: the server generates questions from the relevant study context, the student answers, and the attempt is stored after validation.
- Important states: no quiz yet, generating, in progress, submitted, provider failure, and invalid quiz payload.
- Dependencies: study context from the plan or tasks, the AI boundary, and stored attempts.
- Future implementation notes: reject quizzes that do not match the requested schema. Do not show raw provider errors.

### Performance Tracking

- Purpose: show progress, gaps, and consistency over time.
- User value: the student can see whether the work is moving the Goal forward.
- Expected behavior: summaries are derived from task completion, quiz attempts, and study activity. The view explains the gap in plain language.
- Important states: not enough data, loading, ready, and unavailable history.
- Dependencies: Daily Tasks, AI Quiz attempts, and stored activity. No AI call is required to display saved history.
- Future implementation notes: this area feeds the Adaptive Study Plan. It is not itself a new plan.

### Adaptive Study Plan

- Purpose: change later study when performance shows what needs attention.
- User value: the plan stays honest as the student improves or struggles.
- Expected behavior: a server-side update revises the Study Plan from performance evidence. The student can see what changed and why.
- Important states: no evidence yet, updating, updated, provider or validation failure, and unchanged plan.
- Dependencies: Performance Tracking, the current Study Plan, and the AI boundary.
- Future implementation notes: keep the revised plan on the same Goal. Do not replace a failed update with a fabricated plan.

### AI Tutor

- Purpose: answer the student in the context of their Goal and recent work.
- User value: guidance stays on the learning journey instead of becoming a general chat.
- Expected behavior: the student asks a question, the server sends the allowed context to the provider, and the reply is validated before it is shown or stored.
- Important states: no conversation yet, waiting for a reply, reply shown, provider failure, and rejected output.
- Dependencies: Authentication, Goal context, the AI boundary, and stored conversation history.
- Future implementation notes: do not send secrets or unrelated personal data in the prompt. Do not expose the provider key.

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
