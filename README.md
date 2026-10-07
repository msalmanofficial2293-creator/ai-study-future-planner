# AI Study Future Planner

AI Study Future Planner helps students turn a future goal into a structured learning journey.

This file is the master project index. Detailed specifications live in [`docs/`](docs/). Agent instructions live in [`AGENTS.md`](AGENTS.md). These Markdown files are project context. They are not a database and must not store student data.

## 1. Product Overview

A student names the future they are studying toward. The product then keeps roadmap, study, practice, and review on one path:

Goal → AI Future Roadmap → Study Plan → Daily Tasks → AI Quiz → Performance Tracking → Adaptive Study Plan → AI Tutor

The public home page introduces that journey. It does not create a goal, generate a plan, or call an AI provider.

Product specification: [docs/product.md](docs/product.md). Feature status: [docs/features.md](docs/features.md).

## 2. Product Vision

The long-term purpose is a calm, trustworthy study platform where planning, daily work, practice, and tutoring stay tied to the same goal. Progress should change what the student does next. The product should feel precise and student-focused, not like a generic chat tool or a copy of another product.

## 3. Current Development Status

The repository is in the foundation phase. Source control is on GitHub: [msalmanofficial2293-creator/ai-study-future-planner](https://github.com/msalmanofficial2293-creator/ai-study-future-planner).

Implemented:

- Next.js application shell with TypeScript, Tailwind CSS, and ESLint
- Public landing page, shared layout, and the Ink and Horizon visual system
- Not-found and recoverable error pages
- Public metadata, `robots.txt`, and `sitemap.xml`
- Environment variable structure for the public site URL and public Supabase Auth values
- Email and password authentication with server-side sessions
- Project documentation
- Development AI Future Roadmap on Future Planner, stored in the existing roadmap tables. It does not call a paid AI provider.
- Study Plan tasks for the current roadmap, stored in the existing study plan tables. They do not call a paid AI provider.
- Daily Tasks for that study plan. Completion stays on the same task rows.
- Development AI Quiz on the current study plan, stored in the existing quiz tables. It does not call a paid AI provider.
- Performance Tracking from saved tasks, quiz attempts, and performance snapshots. It does not call a paid AI provider.
- Adaptive Study Plan rules that can add tasks to the current study plan from saved quiz scores. They do not call a paid AI provider.

Not implemented:

- Onboarding, profile, settings, and password recovery
- AI Tutor
- Database, application API routes, and AI provider integration
- Payments, cloud hosting, staging, production, and a custom domain

Do not describe a planned area as implemented.

## 4. Technology Stack

| Layer | Current choice |
| --- | --- |
| UI | Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4 |
| Server | Next.js server rendering and, later, route handlers in this repository |
| Authentication | Supabase Auth. Email and password, server-side sessions. |
| Database | Not connected. Supabase is used for Auth only. |
| AI | Not connected. Requests must go through a server-side boundary. |
| Quality | ESLint and `tsc`. No test runner is installed yet. |
| Source | Git and GitHub |

Node.js 20 or newer and npm are required locally.

## 5. Documentation Index

| Document | Purpose |
| --- | --- |
| [Product](docs/product.md) | Purpose, users, journey, product areas, and phase. |
| [Features](docs/features.md) | Implemented and planned behavior. |
| [Architecture](docs/architecture.md) | Current code layout and intended production boundaries. |
| [UI design](docs/ui-design.md) | Visual identity, accessibility, and interface states. |
| [Database](docs/database.md) | PostgreSQL schema and row level security. The app reads and writes `profiles` and the first `goals` row. |
| [API](docs/api.md) | Server API strategy. `POST /api/ai/test` is the connectivity route. |
| [AI system](docs/ai-system.md) | Server-side OpenAI boundary. The Future Planner roadmap uses a local generator, not this client. |
| [Security](docs/security.md) | Current baseline and production security principles. |
| [Testing](docs/testing.md) | Current checks and the intended QA path. |
| [Deployment](docs/deployment.md) | Local run steps and the intended release path. |

## 6. Project Structure

```text
src/app/                  Routes, root layout, global CSS, SEO files
src/app/onboarding/       Protected onboarding form
src/app/app/profile/      Protected profile view and update
src/components/brand/     Product mark
src/components/layout/    Header, footer, skip link
src/components/ui/        Shared interface primitives
src/components/home/      Landing page sections
src/config/               Public site config, env parsing, page content
src/features/auth/        Authentication actions and forms
src/features/onboarding/  Onboarding validation, action, and form
src/features/profile/     Profile view, edit form, and avatar initials
src/services/onboarding.ts  Profile and first-goal database access for onboarding
src/services/profile.ts   Read and update the signed-in profile and first goal
src/services/ai.ts        Server-only OpenAI Responses client
src/app/api/ai/test/      Authenticated AI connectivity route
src/lib/                  Shared utilities
src/lib/supabase/         Supabase browser client, server client, session refresh
src/proxy.ts              Auth session refresh and route protection
supabase/migrations/      PostgreSQL schema. Not executed by the Next.js app.
docs/                     Product and engineering documentation
```

Later code belongs in the locations in [docs/architecture.md](docs/architecture.md). Add a directory when it has real code.

## 7. Development Rules

Authoritative agent instructions: [AGENTS.md](AGENTS.md). [CLAUDE.md](CLAUDE.md) points at that file.

- Inspect existing code before changing it.
- Work only on the requested task. Do not start a later phase without permission.
- Do not rewrite a working feature unless the task requires it.
- Follow the current architecture and visual system.
- Use TypeScript strictly. Prefer reusable components. Avoid duplicated logic and unnecessary dependencies.
- Keep UI, business logic, services, API handlers, configuration, and types separated.
- Keep public pages responsive and accessible.
- Handle loading, empty, success, and error states when a feature has those states.
- Run the checks that match the change, then report what was actually tested.

Workflow: Inspect → Plan → Implement → Validate → Report.

## 8. Security Rules

Details: [docs/security.md](docs/security.md).

- Secrets belong in server-only environment variables or the host environment. Do not commit them.
- `NEXT_PUBLIC_` values are visible to the browser. Public names are `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Do not put AI provider API keys, database URLs, service-role keys, or session secrets in client code.
- AI requests run on the server. `POST /api/ai/test` checks the Supabase session before it calls OpenAI. The API key is `OPENAI_API_KEY` and is not a `NEXT_PUBLIC_` variable.
- Do not store or return personal study data. Accounts exist. Study records do not.
- Error pages may show a safe reference. They must not reveal internal details.

## 9. Testing

Details: [docs/testing.md](docs/testing.md).

Current local checks:

```bash
npm run lint
npm run typecheck
npm run build
```

No unit, integration, or end-to-end runner is installed. Add one when a feature needs automated coverage. The intended path is development, local validation, pull request, CI checks, staging, then production. CI, staging, and production are not set up.

## 10. Deployment

Details: [docs/deployment.md](docs/deployment.md).

Intended flow, not yet provisioned beyond GitHub:

Local development → Git → GitHub → Cloud deployment → Production → Custom domain

Environments to keep separate later: development, staging, and production. Only local development exists today. Nothing has been deployed to a cloud host, and no custom domain is connected.

Local setup:

```bash
npm install
```

```powershell
Copy-Item .env.example .env.local
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm run build` then `npm run start` checks the production build locally. `.env.local` is gitignored.
