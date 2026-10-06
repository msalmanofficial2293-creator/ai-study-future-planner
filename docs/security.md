# Security

Production security principles for AI Study Future Planner, plus the baseline that exists today. The complete security system is not implemented.

## Current baseline

- `.env*` is gitignored. `.env.example` is committed and lists names only. It does not contain real values.
- Public variables are `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. They are readable by the browser, so they must stay non-secret.
- `src/config/env.ts` accepts the site URL only when it is an absolute `http` or `https` URL.
- The Supabase URL must be `https`. The publishable key is the public Supabase key. A secret key or service-role key is not configured and must not be added to client code or to a `NEXT_PUBLIC_` name.
- The Next.js `X-Powered-By` header is disabled.
- The route error view may show a digest reference. It does not show an internal error message.
- No database or AI credentials exist.

## Secrets and environment variables

- Keep API keys, database URLs, and session secrets in server-only environment variables or the host environment.
- Never commit secrets, never put them in Markdown, and never prefix them with `NEXT_PUBLIC_`.
- Never put an AI provider API key in client-side code.
- Read secrets inside server services or route handlers when those features exist.
- `.env.example` may list a variable name. It must not contain a real value.

## Authentication and authorization

Supabase Auth provides email and password accounts. The application does not store passwords.

- Browser and server clients use only the public Supabase URL and publishable key.
- The server checks the user with `auth.getUser()`. Client state is not enough to open `/app`.
- `src/proxy.ts` refreshes the session cookie on matched requests and applies the login and `/app` redirects.
- Auth cookies are written by `@supabase/ssr`. Do not copy access tokens or refresh tokens into page HTML, logs, or query strings.
- Signup, login, and logout run as server actions. Validation runs again on the server. Friendly errors replace provider messages. Passwords and tokens are not logged.
- Email confirmation depends on the Supabase project. If it is enabled, signup does not create a local session until the student confirms.
- Protected product data does not exist yet. When it does, authorize every read and write against that student's own records.
- Password recovery and account deletion are not implemented.

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

Login, signup, and logout are Next.js server actions. Next.js checks the action origin. Session cookies come from Supabase SSR and use its cookie options, including SameSite. Do not store the access token where page script reads it as an authorization shortcut.

## Headers and transport

- `X-Powered-By` is already disabled.
- Staging and production must use HTTPS once those environments exist. They do not exist yet.
- Add a content security policy and related headers when the deployment phase defines the host. Do not claim that policy is active now.

## Logging and errors

- Do not log secrets, passwords, access tokens, refresh tokens, or full student submissions.
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
