# Architecture

This document records how the codebase is organized and how later systems should attach to it.

## Application shape

The app is a Next.js App Router project. Server and client code live in one repository for now. Server-only work stays on the server so the project can later move AI, data, or authentication into a separate service without rewriting the UI.

## Directory map

```text
src/app/                 Routes, root layout, global CSS, SEO files
src/components/brand/    Product mark
src/components/layout/   Header, footer, skip link
src/components/ui/       Reusable interface primitives
src/components/home/     Home page sections
src/config/              Public site config, env parsing, page content
src/lib/                 Shared utilities
docs/                    Project documentation
```

Add a directory when it has real code. Do not add empty placeholder trees.

## Where later code belongs

| Concern | Location | Rule |
| --- | --- | --- |
| Routes and pages | `src/app` | Keep pages thin. Compose features and shared UI. |
| Feature UI and logic | `src/features/<feature>` | Colocate a feature when it has its own flow. |
| Reusable UI | `src/components` | Share only components used by more than one feature, or the public shell. |
| Server integrations | `src/services` | Database, AI, and other external calls. No secrets in client modules. |
| HTTP handlers | `src/app/api` | Validate input and call services. Do not put provider logic in the route file. |
| Shared types | `src/types` | Cross-feature types only. Feature-local types stay in the feature. |
| Configuration | `src/config` | Non-secret config and env parsing. |
| Utilities | `src/lib` | Pure helpers with no product workflow. |

## Rendering

The home page is a server-rendered React tree. Add `"use client"` only when a component needs browser state, events beyond simple links, or browser APIs. The route error boundary is a client component because Next.js requires that.

## Environment

`src/config/env.ts` reads public configuration. It currently exposes the site URL and Node environment. Secret values must not be added to that module.

## SEO

Public routes set metadata in `src/app/layout.tsx`. `src/app/robots.ts` and `src/app/sitemap.ts` cover the public home page. Add route-specific metadata when new public pages exist.

## Explicitly deferred

- Authentication and session handling
- Database clients and queries
- AI provider clients
- Background jobs and payments

## Related documents

- [API](api.md)
- [Database](database.md)
- [AI system](ai-system.md)
- [Security](security.md)
- [README](../README.md)
