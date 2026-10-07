# Architecture

Intended production shape for AI Study Future Planner, and the structure that exists in the foundation phase.

## Current direction

| Layer | Decision |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 |
| Server | Next.js server rendering now. Route handlers in this repository when a feature needs an API. |
| Authentication | Supabase Auth through `@supabase/ssr`. Email and password only. |
| Database | Supabase PostgreSQL. Onboarding and the Future Planner read `profiles` and the student's first `goals` row with the signed-in session. Future Planner also writes that student's `roadmaps` and `roadmap_milestones` rows. |
| AI | OpenAI Responses API through `src/services/ai.ts`. The key stays server-only. Roadmap generation is not implemented. |
| Deployment | Intended path is GitHub, then a cloud deployment, then a custom domain. Only GitHub is in place. |

A separate backend service may replace in-process services later if scale requires it. UI should call a small server boundary so that move stays local. Do not add that service now.

## Separation of concerns

| Concern | Responsibility | Where it lives |
| --- | --- | --- |
| UI | Pages, layout, and reusable presentation. | `src/app`, `src/components` |
| Business logic | Feature rules that do not talk to a provider directly. | `src/features/<feature>` when a feature exists |
| Services | Database, AI, and other external calls. Auth session access lives in `src/lib/supabase` because it is shared by the proxy, server actions, and server pages. | `src/services` when database or AI calls exist |
| API | HTTP validation, auth checks, and service calls. | `src/app/api` when a route is required |
| Database | Student tables, keys, and row level security. Onboarding uses `profiles` and `goals`. | Server-side service in `src/services/onboarding.ts`. See [database.md](database.md). |
| AI | Provider prompts, model calls, and response checks. | Server-side AI service. See [ai-system.md](ai-system.md). |
| Configuration | Public site config and env parsing. | `src/config` |
| Types | Shared contracts. Feature-local types stay in the feature. | `src/types` for cross-feature types |
| Documentation | Product and engineering context. Not user data. | `docs/`, [README.md](../README.md) |

Add a directory when it has real code. Do not create empty trees.

## Directory map today

```text
src/app/                  Routes, root layout, global CSS, SEO files
src/app/login/            Login page
src/app/signup/           Signup page
src/app/auth/callback/    Auth code exchange route
src/app/onboarding/       Protected first-goal onboarding
src/app/app/              Temporary signed-in verification page
src/app/app/future-planner/  Protected goal view and goal update
src/app/app/study-plan/   Protected study plan and tasks for the current roadmap
src/app/app/daily-tasks/  Protected day view of the current study plan tasks
src/app/app/quiz/         Protected development quiz for the current study plan
src/app/app/performance/  Protected performance view of saved tasks, quizzes, and snapshots
src/app/app/profile/      Protected profile view and update
src/components/auth/      Shared auth panel
src/components/brand/     Product mark
src/components/layout/    Header, footer, skip link
src/components/ui/        Shared primitives
src/components/home/      Landing page sections
src/features/profile/      Profile view, edit form, account controls, and avatar initials
src/features/future-planner/  Goal update form and roadmap generate button
src/features/roadmap/     Roadmap draft, development generator, and saved roadmap panel
src/features/study-plan/  Study task forms and the task board
src/features/daily-tasks/ Day-focused task list
src/features/quiz/        Development quiz questions, attempt flow, and result review
src/features/performance/ Performance metrics and dashboard from saved study rows
src/features/ai/          Connectivity-check validation and allowance
src/features/onboarding/  Onboarding validation, action, and form
src/features/auth/        Auth actions, validation, and forms
src/services/profile.ts     Read and update the signed-in profile and first goal
src/services/future-planner.ts  Read profile context and update the first goal
src/services/roadmap.ts   Load and save the current roadmap for the signed-in student
src/services/study-plan.ts  Load the current roadmap and save that student's study plan and tasks
src/services/daily-tasks.ts  Load today's progress from the current study plan and tasks
src/services/quiz.ts      Load and save the signed-in student's quizzes, attempts, answers, and performance snapshot
src/services/performance.ts  Load performance metrics and save a snapshot when a task status changes
src/services/quiz-generator.ts  Replaceable server quiz generator. The current one is local.
src/services/roadmap-generator.ts  Replaceable server generator. The current one is local.
src/services/ai.ts        Server-only OpenAI Responses client
src/services/onboarding.ts  Profile and first-goal reads and writes for onboarding
src/services/onboarding-status.ts  Shared onboarding completion check
src/config/               Site config, public env parsing, page content
src/lib/supabase/         Browser client, server client, session refresh
src/lib/ai/               Server-only OpenAI key and model config
src/app/api/ai/test/      Authenticated connectivity route
src/proxy.ts              Request session refresh and auth redirects
supabase/migrations/      PostgreSQL schema. Not executed by the Next.js app.
docs/                     Documentation
```

There is no `src/types` directory yet. `src/app/api/ai/test/route.ts` is the connectivity route.

## Rules for later code

- Keep pages thin. Compose features and shared UI.
- Share a component from `src/components` only when more than one feature uses it, or when it belongs to the public shell.
- Route handlers validate input, check authorization, call a service, and return a typed response.
- Do not put provider logic or database queries in a route file or a client component.
- `src/config/env.ts` exposes the public site URL and Node environment. Do not add secrets to that module.
- Public Supabase values are read in `src/lib/supabase/config.ts`: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Do not add a secret or service-role key.
- Add `"use client"` only when a component needs browser state, events beyond simple links, or browser APIs. The route error boundary is a client component because Next.js requires it.

## Rendering and SEO

The landing page is a server-rendered React tree. Public metadata is set in `src/app/layout.tsx`. `src/app/robots.ts` and `src/app/sitemap.ts` cover the public home page. Login, signup, and `/app` set `noindex`.

## Authentication

Supabase Auth is the only authentication provider.

| Piece | Role |
| --- | --- |
| `createSupabaseBrowserClient` | Browser client for later client-side auth calls. Forms in this phase use server actions. |
| `createSupabaseServerClient` | Server client. Reads and writes the auth cookies from `next/headers`. |
| `getAuthenticatedUser` | Calls `auth.getUser()` so the server validates the session. |
| `src/proxy.ts` | Refreshes the session cookie and redirects. Unauthenticated `/app` and `/onboarding` go to `/login`. Authenticated `/login` and `/signup` go to `/onboarding` until `profiles.onboarding_completed_at` is set, then to `/app`. |

`/auth/callback` exchanges an auth `code` for a session. It can also verify an email `token_hash` on the server, then redirects to `/app`. Failures go to `/login` with a fixed error code. Tokens are not written into the page.

Signup stores the full name in Supabase user metadata (`full_name`). The database migration copies that name into `profiles` when it has been applied. If email confirmation is enabled, signup returns no session and the form asks the student to check their email. It does not send them to `/app` until a session exists.

Logout calls `auth.signOut()` in a server action, which clears the auth cookies, then redirects to `/login`.

There is one browser client factory and one server client factory. Do not create another Supabase client.

## Request path when APIs exist

`POST /api/ai/test` uses this shape. Study generation routes are not built yet.

Client → Server API → Authentication → Validation → Business logic → AI or database → Response

Details: [api.md](api.md).

## Explicitly deferred

- Queries against adaptive plans
- Password recovery and account deletion
- Paid-model roadmap generation, plus plan, quiz, and tutor generation
- A separate backend service
- Cloud hosting, staging, production, and a custom domain

## Related documents

- [API](api.md)
- [Database](database.md)
- [AI system](ai-system.md)
- [Security](security.md)
- [Deployment](deployment.md)
- [README](../README.md)
