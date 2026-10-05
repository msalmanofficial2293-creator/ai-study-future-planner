# AI Study Future Planner

AI Study Future Planner is a production web application that will help students define a future goal and follow a personalized learning journey.

This repository is in the **foundation phase**. The public home page, project structure, styling system, environment setup, and documentation are in place. Product features such as accounts, data storage, and AI generation are not implemented yet.

## Documentation

README.md is the master index. The files below are project knowledge for product, architecture, and development. They are not a database, and they must not store user data.

| Document | Purpose |
| --- | --- |
| [Product](docs/product.md) | Who the product is for, the learning journey, and the current phase. |
| [Architecture](docs/architecture.md) | How the codebase is organized and how later layers should fit. |
| [Features](docs/features.md) | Planned product capabilities and what exists today. |
| [UI design](docs/ui-design.md) | Visual identity, responsive behavior, and accessibility. |
| [Database](docs/database.md) | Rules for the future production database. |
| [API](docs/api.md) | Rules for future server and API boundaries. |
| [AI system](docs/ai-system.md) | Rules for the future server-side AI integration. |
| [Security](docs/security.md) | Secret handling and the current security baseline. |
| [Testing](docs/testing.md) | How to check the foundation, and what testing comes later. |
| [Deployment](docs/deployment.md) | Local run steps and deployment boundaries. |

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS 4
- ESLint

## Requirements

- Node.js 20 or newer
- npm

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, copy the example file with:

```powershell
Copy-Item .env.example .env.local
```

Open [http://localhost:3000](http://localhost:3000).

`.env.local` is gitignored. Only `NEXT_PUBLIC_APP_URL` is used in this phase. Do not add API keys, database URLs, or other secrets to client-side code.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run the TypeScript compiler without emitting files. |
| `npm run build` | Create a production build. |
| `npm run start` | Serve the production build. |

## Project structure

```text
src/
  app/            Routes, layouts, global styles, and metadata
  components/     Reusable UI, layout, and brand components
  config/         Site, environment, and public page content
  lib/            Small shared utilities
docs/             Project documentation
```

Feature modules, services, API routes, and shared domain types will be added when those phases start. See [Architecture](docs/architecture.md).

## Current boundaries

Do not add these until a later phase explicitly asks for them:

- Authentication
- Database integration
- AI provider calls or API keys
- Payments
- Dashboard, quiz, study planner, or roadmap generator

## Development rules

1. Work only on the phase that was requested.
2. Inspect existing files before changing them.
3. Keep routes, UI, business logic, services, API code, utilities, types, configuration, and documentation separated.
4. Use TypeScript strictly. Do not introduce `any` to silence errors.
5. Keep secrets in server-side environment variables. Never expose them with `NEXT_PUBLIC_` or in client components.
6. Handle loading, empty, success, and error states when a feature has those states.
7. Keep public pages responsive, accessible, and indexable.
