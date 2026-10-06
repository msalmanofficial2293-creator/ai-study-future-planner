# Deployment

Intended release path for AI Study Future Planner. This phase does not deploy the application.

## Intended flow

Local development → Git → GitHub → Cloud deployment → Production → Custom domain

| Step | Status |
| --- | --- |
| Local development | Available with `npm run dev`. |
| Git | The repository is initialized. |
| GitHub | Public repository: [msalmanofficial2293-creator/ai-study-future-planner](https://github.com/msalmanofficial2293-creator/ai-study-future-planner). |
| Cloud deployment | Not created. The host is not chosen. |
| Production | Not deployed. |
| Custom domain | Not connected. |

## Environments

Keep development, staging, and production separate when they exist.

| Environment | Purpose | Status |
| --- | --- | --- |
| Development | Local work with `.env.local`. | In use. |
| Staging | A cloud environment for review before production. | Not created. |
| Production | The public hosted application. | Not created. |

Each environment gets its own variables. Do not point staging at the production database or AI key once those exist.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_APP_URL` to the local origin, usually `http://localhost:3000`.
4. Start the app with `npm run dev`.

Production-mode check on the same machine:

```bash
npm run build
npm run start
```

## Environment variables

| Variable | Required now | Exposure | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | No. Defaults to `http://localhost:3000` if unset. | Public | Canonical URL, Open Graph URL, the sitemap link, and the auth email redirect origin. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes, for sign-in. | Public | Supabase project URL. Must be `https`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes, for sign-in. | Public | Supabase publishable key. Not a secret or service-role key. |

If the variable is set, it must be an absolute `http` or `https` URL. An invalid value fails startup.

Future secrets, including a database URL and an AI provider key, belong in the host environment or in `.env.local`. Do not prefix secrets with `NEXT_PUBLIC_`. Do not commit real values. When staging and production exist, set `NEXT_PUBLIC_APP_URL` to that environment's public origin.

## Build process

`npm run build` creates the Next.js production output in `.next`. That directory is gitignored. The build runs TypeScript. Lint is a separate command, `npm run lint`.

A future cloud deployment should run the same build from a clean install. It is not configured.

## Deployment checks

Before a future production release:

- `npm run lint`, `npm run typecheck`, and `npm run build` succeed.
- Required environment variables for that environment are present and contain no placeholder secrets.
- The public URL matches `NEXT_PUBLIC_APP_URL`.
- Authenticated and AI paths, once they exist, are exercised on staging before production.

CI is not set up. See [testing.md](testing.md).

## Rollback

Not automated. When a cloud host exists, rollback means redeploying the previous known-good Git revision and confirming the public site responds. Database migrations, once they exist, need a forward plan that does not depend on editing production data by hand. Document the host's rollback control in this file when the host is chosen.

## Domain and HTTPS

The custom domain is not connected. Staging and production must be served over HTTPS. Do not send authentication cookies or AI traffic to an unencrypted public host.

## Monitoring

Not set up. A later deployment should record availability, failed requests, and AI or database errors without logging secrets or full student submissions. See [security.md](security.md).

## Related documents

- [Security](security.md)
- [Testing](testing.md)
- [Architecture](architecture.md)
- [README](../README.md)
