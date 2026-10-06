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
- User value: the student can confirm the destination before any roadmap exists.
- Expected behavior: `/app/future-planner` is available only to a signed-in student who has finished onboarding. It shows the current career goal, target outcome, education level, field of study, skill level, weekly study time, and learning style. The student can update the career goal and target outcome. The save writes that student's earliest `goals` row, or inserts one if none exists. Profile context is read from `profiles` and is not edited here. "Generate My AI Future Roadmap" explains that generation is not available and does not call an AI provider or create a roadmap.
- Important states: loading, no goal yet, saved, validation error, save failure, and a failure to load the student's records. The submit control stays disabled while the save is in progress, and a second submit is ignored.
- Dependencies: Authentication, completed onboarding, and the existing row level security policies. No service-role key is used.
- Future implementation notes: keep the object name Goal. Do not rename it to a roadmap or a plan. AI generation stays a later step.

### Profile

- Purpose: let a signed-in student see and update the identity and study context already stored for them.
- User value: the student can correct their name, learning context, and goal without starting over.
- Expected behavior: `/app/profile` is available only to a signed-in student. It shows full name, email, education level, field of study, skill level, weekly study time, learning style, career goal, and target outcome. Email is read-only. Edit profile opens the form. Save changes writes `profiles` for that student and the earliest `goals` row, or inserts a goal if none exists. Cancel leaves the saved values in place. The avatar is the student's initials. Photo upload is not available, and no image is stored.
- Important states: loading, not set yet, editing, saving, saved, validation error, save failure, and a profile row that is not ready. The save control stays disabled while the request is in progress, and a second submit is ignored.
- Dependencies: Authentication and the existing row level security policies. No service-role key and no storage bucket are used.
- Future implementation notes: account deletion, password recovery, and avatar upload are not part of this page.

## Planned

### AI Future Roadmap

- Purpose: turn a Goal into an ordered path of skills and milestones.
- User value: the student can see how the goal breaks into stages.
- Expected behavior: a server-side AI request proposes a roadmap. The student can read the milestones in order. The result is stored only after validation.
- Important states: no roadmap yet, generating, ready, provider failure, and invalid model output.
- Dependencies: a saved Goal, the server AI boundary in [ai-system.md](ai-system.md), and the database.
- Future implementation notes: the browser must not call the AI provider. Do not invent a roadmap when generation fails.

### Study Plan

- Purpose: turn the AI Future Roadmap into a plan the student can follow.
- User value: milestones become a sequence of study, not only a list of ambitions.
- Expected behavior: the plan is derived from the current roadmap and remains tied to the same Goal. The student can see what comes next.
- Important states: no plan yet, generating or saving, ready, empty roadmap, and failure.
- Dependencies: AI Future Roadmap, server-side generation or mapping, and persistence.
- Future implementation notes: a later Adaptive Study Plan updates this plan. It does not create a second, disconnected plan.

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
- Expected behavior: password recovery and account deletion, as described in [security.md](security.md). Photo upload is not part of the profile page.
- Important states: recovery sent, signed out, and deletion pending or failed.
- Dependencies: Authentication and the database.
- Future implementation notes: do not collect fields that no current feature uses.

## Related documents

- [Product](product.md)
- [Architecture](architecture.md)
- [AI system](ai-system.md)
- [README](../README.md)
