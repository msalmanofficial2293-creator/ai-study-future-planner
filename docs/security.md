# Security

Production security principles for AI Study Future Planner, plus the baseline that exists today. The complete security system is not implemented.

## Current baseline

- `.env*` is gitignored. `.env.example` is committed and contains only the public site URL placeholder.
- The only configured value is `NEXT_PUBLIC_APP_URL`. Public variables are readable by the browser, so they must stay non-secret.
- `src/config/env.ts` accepts that URL only when it is an absolute `http` or `https` URL.
- The Next.js `X-Powered-By` header is disabled.
- The route error view may show a digest reference. It does not show an internal error message.
- No authentication, database, or AI credentials exist.

## Secrets and environment variables

- Keep API keys, database URLs, and session secrets in server-only environment variables or the host environment.
- Never commit secrets, never put them in Markdown, and never prefix them with `NEXT_PUBLIC_`.
- Never put an AI provider API key in client-side code.
- Read secrets inside server services or route handlers when those features exist.
- `.env.example` may list a variable name. It must not contain a real value.

## Authentication and authorization

Authentication is not implemented. Before any feature stores or returns personal study data:

- Require an authenticated student.
- Authorize every read and write against that student's own records.
- Treat a missing session and a forbidden record as safe errors, not as empty access to someone else's data.

## Validation

- Validate input on the server even when the form also validates in the browser.
- Validate AI output before storing or presenting it as a roadmap, plan, quiz, or tutor message. See [ai-system.md](ai-system.md).
- Reject unexpected fields instead of passing them through.

## Rate limiting

Not implemented. Account, generation, and tutor routes will need limits so one client cannot exhaust the AI provider or the database. Choose the limits in the phase that adds those routes.

## Database access

- Connect from server-side services only.
- Use a least-privilege database credential.
- Do not expose the connection string to the browser or to logs.
- See [database.md](database.md).

## XSS

React escapes text rendered as children. Keep that default.

- Do not render raw HTML from students or from the AI provider.
- If a later task must render formatted model output, sanitize it on the server and document the sanitizer here.
- Do not use client-side HTML injection to display quiz or tutor content.

## CSRF

The foundation has no authenticated mutation. When cookie-based sessions and mutating routes exist, use a SameSite cookie policy and the framework's protection for those requests. Document the chosen control in this file at that time. Bearer tokens stored where script can read them are not an acceptable shortcut.

## Headers and transport

- `X-Powered-By` is already disabled.
- Staging and production must use HTTPS once those environments exist. They do not exist yet.
- Add a content security policy and related headers when the deployment phase defines the host. Do not claim that policy is active now.

## Logging and errors

- Do not log secrets, session tokens, or full student submissions.
- Do not return stack traces, SQL, prompts, or provider errors to the browser.
- An error message should tell the student what to do next, plus a safe reference when one exists.

## Privacy and account deletion

Student study data is personal. Collect only what the current feature needs.

When accounts exist, a student must be able to delete the account and the associated profile, goals, plans, tasks, attempts, and tutor conversations. Deletion is not implemented. Design it with the authentication and database phases, including what backups may retain and for how long.

## Dependencies

Add a dependency only when a phase needs it. Review it before adding it. Do not downgrade the framework to silence an advisory in a development tool if that downgrade breaks the current Next.js version.

## Related documents

- [Architecture](architecture.md)
- [API](api.md)
- [Database](database.md)
- [AI system](ai-system.md)
- [Deployment](deployment.md)
- [README](../README.md)
