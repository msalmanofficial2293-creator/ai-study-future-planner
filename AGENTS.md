<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent instructions

These instructions apply to every coding agent in this repository. [README.md](README.md) is the master project index. Specifications live in [docs/](docs/).

The block above is maintained by Next.js. Leave it in place. Read `node_modules/next/dist/docs/` before writing framework code.

## Rules

- Always inspect existing code before modifying it.
- Never rewrite working features unnecessarily.
- Work only on the requested task.
- Do not implement future phases without permission.
- Follow the architecture in [docs/architecture.md](docs/architecture.md).
- Use TypeScript strictly. Do not use `any` to silence the compiler.
- Prefer reusable components.
- Avoid duplicated logic.
- Do not introduce unnecessary dependencies.
- Never expose secrets.
- Never put AI provider API keys in client-side code.
- Never prefix a secret with `NEXT_PUBLIC_`.
- Keep server-side logic separate from client-side UI.
- Maintain accessibility.
- Maintain responsive behavior.
- Handle loading, error, and empty states when a feature fetches or submits data.
- Run appropriate checks after changes.
- Do not claim a feature works unless it has actually been tested.
- Do not mark a planned feature as implemented in docs or in the UI.

## Workflow

Inspect → Plan → Implement → Validate → Report

1. Inspect the files the task touches and the related document in `docs/`.
2. Plan the smallest change that fits the current architecture.
3. Implement only that change.
4. Validate with the checks the change requires. Use `npm run lint` and `npm run typecheck` for code changes. Use `npm run build` when routing, config, or rendering changes.
5. Report what changed, what was tested, and what remains incomplete.

## Phase boundary

The app is in the foundation phase: a public landing page and project shell. Authentication, database, AI, payments, and the study journey are specified in `docs/` and are not built. Do not add them unless the current task asks for that phase.
