# Architecture

Intended production shape for AI Study Future Planner, and the structure that exists in the foundation phase.

## Current direction

| Layer | Decision |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 |
| Server | Next.js server rendering now. Route handlers in this repository when a feature needs an API. |
| Database | A cloud database will be added later. None is connected. |
| AI | No provider is connected. Future requests go through a secure server-side boundary. |
| Deployment | Intended path is GitHub, then a cloud deployment, then a custom domain. Only GitHub is in place. |

A separate backend service may replace in-process services later if scale requires it. UI should call a small server boundary so that move stays local. Do not add that service now.

## Separation of concerns

| Concern | Responsibility | Where it lives |
| --- | --- | --- |
| UI | Pages, layout, and reusable presentation. | `src/app`, `src/components` |
| Business logic | Feature rules that do not talk to a provider directly. | `src/features/<feature>` when a feature exists |
| Services | Database, AI, and other external calls. | `src/services` when those calls exist |
| API | HTTP validation, auth checks, and service calls. | `src/app/api` when a route is required |
| Database | Persistence of student data. | Server-side services only. See [database.md](database.md). |
| AI | Provider prompts, model calls, and response checks. | Server-side AI service. See [ai-system.md](ai-system.md). |
| Configuration | Public site config and env parsing. | `src/config` |
| Types | Shared contracts. Feature-local types stay in the feature. | `src/types` for cross-feature types |
| Documentation | Product and engineering context. Not user data. | `docs/`, [README.md](../README.md) |

Add a directory when it has real code. Do not create empty trees.

## Directory map today

```text
src/app/                  Routes, root layout, global CSS, SEO files
src/components/brand/     Product mark
src/components/layout/    Header, footer, skip link
src/components/ui/        Shared primitives
src/components/home/      Landing page sections
src/config/               Site config, public env parsing, page content
src/lib/                  Shared utilities
docs/                     Documentation
```

There is no `src/features`, `src/services`, `src/types`, or `src/app/api` directory yet.

## Rules for later code

- Keep pages thin. Compose features and shared UI.
- Share a component from `src/components` only when more than one feature uses it, or when it belongs to the public shell.
- Route handlers validate input, check authorization, call a service, and return a typed response.
- Do not put provider logic or database queries in a route file or a client component.
- `src/config/env.ts` exposes public configuration only. It currently reads the site URL and Node environment. Do not add secrets to that module.
- Add `"use client"` only when a component needs browser state, events beyond simple links, or browser APIs. The route error boundary is a client component because Next.js requires it.

## Rendering and SEO

The landing page is a server-rendered React tree. Public metadata is set in `src/app/layout.tsx`. `src/app/robots.ts` and `src/app/sitemap.ts` cover the public home page. Add route-specific metadata when a new public page exists.

## Request path when APIs exist

This flow is not implemented. It is the target shape:

Client → Server API → Authentication → Validation → Business logic → AI or database → Response

Details: [api.md](api.md).

## Explicitly deferred

- Authentication and session handling
- Database clients, schemas, and migrations
- AI provider clients
- A separate backend service
- Cloud hosting, staging, production, and a custom domain

## Related documents

- [API](api.md)
- [Database](database.md)
- [AI system](ai-system.md)
- [Security](security.md)
- [Deployment](deployment.md)
- [README](../README.md)
