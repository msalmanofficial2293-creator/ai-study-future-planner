# API

This document will describe HTTP and server interfaces when they exist. The foundation has no application API routes.

## Current surface

Next.js serves the public home page, `robots.txt`, and `sitemap.xml`. There is no `/api` route, and the home page does not call a backend.

## Rules for later API work

- Add route handlers under `src/app/api` only when a feature needs them.
- Keep handlers thin: validate input, call a service, return a typed response.
- Put provider calls, database access, and AI prompts in `src/services`, not in the route file and not in client code.
- Return clear success and error responses. Do not invent success with hardcoded student data.
- Do not send secrets, provider keys, or raw provider errors to the browser.
- If a separate backend service replaces these routes later, keep the UI calling a small client boundary so the swap stays local.

## Not in this phase

Do not add route handlers, mock servers, or fake JSON endpoints.

## Related documents

- [Architecture](architecture.md)
- [AI system](ai-system.md)
- [Security](security.md)
- [README](../README.md)
