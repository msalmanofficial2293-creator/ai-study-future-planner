# Security

This document records the security baseline for the foundation and the rules later phases must keep.

## Current baseline

- Secrets are not committed. `.env*` is gitignored, with `.env.example` allowed because it contains only placeholders.
- The only configured value is `NEXT_PUBLIC_APP_URL`. Public environment variables are readable by the browser, so they must stay non-secret.
- `src/config/env.ts` reads that public URL and rejects a value that is not an absolute `http` or `https` URL.
- The Next.js `X-Powered-By` header is disabled.
- The route error view shows a digest reference, not an internal error message.
- No authentication, database, or AI credentials exist in this phase.

## Rules

- Never put API keys, database URLs, session secrets, or private prompts in client components, `NEXT_PUBLIC_` variables, markdown docs, or source control.
- Read secrets on the server, in services or route handlers, when those features exist.
- Do not log secrets or full student submissions.
- Add authentication and authorization before any feature stores or returns personal study data.
- Validate input on the server even if the form also validates in the browser.
- Keep dependencies limited to what a phase needs, and review them when they are added.

## Later phases

Authentication, database access, and AI calls will extend this document with the concrete controls they introduce. Do not add those systems until their phase is requested.

## Related documents

- [Architecture](architecture.md)
- [Database](database.md)
- [AI system](ai-system.md)
- [Deployment](deployment.md)
- [README](../README.md)
