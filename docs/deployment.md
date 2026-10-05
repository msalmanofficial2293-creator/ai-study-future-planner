# Deployment

This document covers how to run the foundation locally. Hosting is not configured yet.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_APP_URL` to the local origin, usually `http://localhost:3000`.
4. Start the app with `npm run dev`.

Production-mode check:

```bash
npm run build
npm run start
```

## Environment

| Variable | Required now | Exposure | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | No. Defaults to `http://localhost:3000` if unset. | Public | Canonical URL, Open Graph URL, robots sitemap link. |

If the variable is set, it must be an absolute `http` or `https` URL. An invalid value fails startup.

Future secrets belong in the host's environment or in `.env.local`, never in git. Do not prefix secrets with `NEXT_PUBLIC_`.

## Build output

`npm run build` produces the Next.js production output in `.next`. That directory is gitignored.

## Hosting

No hosting project, domain, or CI pipeline is set up. When deployment is requested, document the host, environment variable setup, and release check in this file. Set `NEXT_PUBLIC_APP_URL` to the public origin in that environment so canonical and sitemap URLs are correct.

The architecture can stay on Next.js server rendering, and it can later move data or AI work to a separate service. Do not add that service in the foundation.

## Related documents

- [Security](security.md)
- [Testing](testing.md)
- [Architecture](architecture.md)
- [README](../README.md)
