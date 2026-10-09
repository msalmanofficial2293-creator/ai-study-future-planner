# Security

Production security principles for AI Study Future Planner, and the controls that are implemented today. This document describes the actual baseline after the security hardening pass. It does not claim the product is fully hardened for every production threat.

## Audit summary (hardening pass)

Inspected authentication, protected routes, server actions, `POST /api/ai/test`, Supabase clients, migrations/RLS, environment handling, AI modules, logging, and session cookies.

Findings that were already sound:

- Sessions use `@supabase/ssr` cookies and `auth.getUser()` on the server. Protected pages also redirect when unauthenticated.
- `src/proxy.ts` refreshes the session and redirects anonymous visitors away from `/app` and `/onboarding`.
- Server actions and study services scope queries with the authenticated user id. RLS is enabled and forced on all fifteen study tables.
- No `SUPABASE_SERVICE_ROLE_KEY` usage in the repository. OpenAI keys are server-only behind `server-only` modules.
- `.env*` is gitignored except `.env.example` (names only).
- Mock AI (roadmap, quiz, adaptive, tutor, personalization) does not need an API key.

Fixes applied in this pass:

- Security response headers for clickjacking and content-type sniffing (see Headers).
- Shared server diagnostic logging that records error codes without provider messages in production.
- In-memory rate limits for login/signup and AI Tutor sends (same pattern as `POST /api/ai/test`).
- Documentation updated to match the real controls.

Remaining production recommendations (not fake controls):

- Shared rate limiting across multiple server instances (current limits are per Node process).
- Broader Content-Security-Policy for scripts once the deployment host is fixed.
- Password recovery and student-facing account deletion.
- Automated cross-account IDOR suite in CI with disposable test users.
- Dependency and host-level monitoring without logging secrets.

## Secrets and environment variables

- `.env*` is gitignored. `.env.example` is committed and lists names only.
- Public variables: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `src/config/env.ts` accepts the site URL only when it is an absolute `http` or `https` URL.
- The Supabase URL must be `https`. The publishable key is public. A secret or service-role key must not be added to client code or to a `NEXT_PUBLIC_` name.
- `OPENAI_API_KEY` and optional `OPENAI_MODEL` are read only in `src/lib/ai/config.ts` (`server-only`).
- Never commit secrets, never put them in Markdown, and never prefix them with `NEXT_PUBLIC_`.

## Authentication and authorization

Supabase Auth provides email and password accounts. The application does not store passwords.

- Browser and server clients use only the public Supabase URL and publishable key.
- The server checks the user with `auth.getUser()`. Client state alone cannot open `/app`.
- `src/proxy.ts` refreshes the session cookie on matched requests and applies login redirects for protected paths.
- Auth cookies are written by `@supabase/ssr`. Do not copy access tokens or refresh tokens into page HTML, logs, or query strings.
- Signup, login, and logout run as server actions. Validation runs again on the server. Friendly errors replace provider messages. Passwords and tokens are not logged.
- Login and signup are limited to 10 attempts per email per minute on a single server instance. Verification resends are limited to 3 per email per five minutes on a single instance.
- Email addresses are normalized to lowercase before signup and login. Supabase Auth enforces one Auth user per email; duplicate signup does not delete or overwrite an existing account.
- Protected application access requires `auth.getUser()` **and** a verified email (`email_confirmed_at`). Unverified sessions are sent to `/verify-email` and cannot open `/app` or `/onboarding`.
- Protected routes: `/app`, `/app/future-planner`, `/app/study-plan`, `/app/daily-tasks`, `/app/quiz`, `/app/performance`, `/app/adaptive-plan`, `/app/ai-tutor`, `/app/personalization`, `/app/profile`, `/app/settings`, and `/onboarding`. Each page (and study service) also checks authentication server-side.
- Public routes: `/`, `/login`, `/signup`, `/verify-email`, `/auth/callback`, plus static assets and metadata routes.
- Every study mutation verifies the authenticated user and scopes writes to that user's rows. Resource ids (task, conversation, quiz attempt, recommendation fingerprint) are checked for ownership before update or delete. Row level security is the second line of defense.
- A signed-in student can change the password from `/app/profile`. The server checks the current password with that student's session, then updates Auth. The new password is not written to `profiles` and is not logged.
- Password recovery and account deletion are not implemented. The profile page includes a delete control that does not delete the account.

### Signup password policy

Application signup (and password change validation) requires:

1. At least 8 characters
2. At least one uppercase English letter (A–Z)
3. At least one lowercase English letter (a–z)
4. At least one digit (0–9)
5. At least one special character (aligned with Supabase Auth’s symbol set)

The signup UI shows live requirement status. The server action re-validates before calling `signUp`. Passwords are never written to logs or returned in error text.

**Manual Supabase Dashboard action (required for Auth-side enforcement):** this cannot be set from application code alone. In the linked Supabase project:

1. Open **Authentication** → **Sign In / Providers** (or **Providers**) → **Email**.
2. Set **Minimum password length** to **8** (or higher).
3. Set **Password requirements** to the strongest option: **digits, lowercase and uppercase letters, and symbols**.
4. Optionally enable **Prevent use of leaked passwords** on Pro plans and above.
5. Save.

Until that dashboard setting matches, Auth may still accept weaker passwords if a client bypassed the app UI; the Next.js server action still rejects them for this app’s signup path.

### Email confirmation (required Dashboard setting)

Application code expects Confirm email to be **enabled**. Without it, Supabase may mark new users verified immediately and grant a session.

**Manual Supabase Dashboard actions:**

1. Open **Authentication** → **Providers** → **Email**.
2. Enable **Confirm email**.
3. Under **URL configuration**, set **Site URL** to the app origin (for local: `http://localhost:3000`; for production: your public `https` origin matching `NEXT_PUBLIC_APP_URL`).
4. Add the same origin’s `/auth/callback` to **Redirect URLs**, e.g. `http://localhost:3000/auth/callback` and the production callback URL.
5. Review the **Confirm signup** email template so the link uses the project’s confirmation URL (PKCE / token hash flow supported by `/auth/callback`).
6. Save.

After signup, the UI asks the student to verify email and offers resend. Login before verification is rejected. Invalid or expired verification links redirect to login with a recovery message and resend option.

### Sessions (access token vs refresh vs inactivity)

| Concept | What it is | Current approach |
| --- | --- | --- |
| Access token lifetime | Short-lived JWT used for Auth API calls | Managed by Supabase Auth (Dashboard JWT expiry). Default is typically about one hour. Do not invent a shorter app-only JWT cut-off. |
| Refresh session | Long-lived refresh token rotates/extends the session via `@supabase/ssr` cookie refresh in `src/proxy.ts` / `updateSession` | Keep enabled. Logout calls `signOut()` and clears the Auth session cookies. |
| Inactivity timeout | App-defined idle logout after no user activity | **Not implemented.** Propose separately if product requires it; do not add an arbitrary short timeout that silently breaks returning students. |

Configure JWT / refresh settings only through Supabase Auth Dashboard values that the project supports. Prefer the platform defaults unless a security review sets explicit values.

## Validation

- Validate input on the server even when the form also validates in the browser.
- Reject unexpected fields on `POST /api/ai/test`. Tutor messages reject empty and oversized content. Conversation ids must be UUIDs and owned by the signed-in student.
- Validate AI output before storing or presenting it as a roadmap, plan, quiz, or tutor message when a paid model is connected. See [ai-system.md](ai-system.md).

## Rate limiting

- `POST /api/ai/test`: 10 calls per signed-in user per 60 seconds (in-process).
- Login and signup: 10 attempts per email per 60 seconds (in-process).
- AI Tutor send: 20 messages per signed-in user per 60 seconds (in-process), plus a per-user in-flight guard.
- These limits protect a single Node process during free development. Multi-instance production needs a shared store.

## Database access and RLS

The study schema is in `supabase/migrations`. Queries run in server-side services with the authenticated Supabase client.

- Apply migrations in Supabase. Do not create or alter these tables from Next.js route handlers.
- The browser uses the publishable key only. Do not add a service-role or secret key.
- Row level security is enabled and forced on `profiles`, `goals`, `roadmaps`, `roadmap_milestones`, `study_plans`, `study_tasks`, `quizzes`, `quiz_questions`, `quiz_attempts`, `quiz_answers`, `performance_records`, `adaptive_plans`, `tutor_conversations`, `tutor_messages`, and `personalization_decisions`.
- `anon` has no privileges on those tables.
- `profiles` lets the signed-in student select and update only `id = auth.uid()`.
- Each other table lets the signed-in student select, insert, update, and delete only `user_id = auth.uid()`.
- Composite foreign keys stop a student from hanging one of their rows off another student's parent row.
- Deleting the Auth user cascades to the profile and owned study rows. A student-facing delete control is not built yet.

### User data isolation

A student must not read or change another student's profile, goals, roadmap, study plan, tasks, quizzes, attempts, performance, adaptive plans, tutor conversations or messages, or personalization decisions. Application queries filter by the authenticated user id. RLS rejects rows that fail `auth.uid()` checks even if a query is wrong.

### Profile avatar storage

Profile photos use the Supabase Storage bucket `avatars` and `profiles.avatar_path`.

- Uploads and removals run as server actions with the authenticated publishable-key client. There is no service-role key.
- The object path is always `{auth.uid()}/avatar.{jpg|png|webp}`. Client-supplied user ids are not trusted for authorization.
- Storage policies allow insert, update, and delete only when the first folder of the object name equals `auth.uid()`.
- The bucket allows public read so avatars can render with a public URL. The bucket is not publicly writable.
- Signed-out requests cannot insert into `avatars` (Storage RLS rejects them). Another authenticated user cannot write under someone else's `{user_id}/` path.
- Server validation rejects files over 5 MB, non-image MIME types, SVG, and payloads whose magic bytes do not match JPEG, PNG, or WebP.
- Failures classify missing bucket/column separately from RLS denials. Full provider messages stay server-side; development may append a short diagnostic code.

### Settings and account controls

`/app/settings` reuses authenticated profile rows for preferences.

- Password changes verify the current password through Supabase Auth, then call `updateUser`. Passwords are never written to application tables or logs.
- Notification toggles persist only `notify_study_reminders` and `notify_product_updates` on `profiles`. Delivery is not implemented yet; the UI states that honestly.
- Learning preference updates write only `skill_level`, `learning_style`, and `weekly_study_time` on the signed-in student's `profiles` row.
- Account deletion remains unavailable until a secure server-side deletion flow exists. The UI does not delete Auth users or profile rows from the browser.

## AI security

- The connectivity check (`POST /api/ai/test`) requires a signed-in session, origin checks, JSON validation, and rate limiting. It never returns the API key, prompt, or stack trace.
- Roadmap, quiz, adaptive, tutor, and personalization generators run on the server and do not call a paid provider in free development mode.
- Tutor context is built from the signed-in student's rows only.
- `OPENAI_API_KEY` stays in server-only modules. Mock mode works with the key unset.

## XSS

React escapes text rendered as children. Keep that default.

- Do not render raw HTML from students or from the AI provider.
- If a later task must render formatted model output, sanitize it on the server and document the sanitizer here.

## CSRF

Login, signup, logout, and study mutations are Next.js server actions. Next.js checks the action origin. Session cookies come from Supabase SSR and use its cookie options, including SameSite. Do not store the access token where page script reads it as an authorization shortcut.

## Headers and transport

- `X-Powered-By` is disabled.
- Application responses set:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: DENY`
  - `Permissions-Policy` denying camera, microphone, geolocation, payment, and USB
  - `Content-Security-Policy: frame-ancestors 'none'` (clickjacking control only; does not restrict scripts)
- Staging and production must use HTTPS once those environments exist.
- A fuller script CSP should wait until the deployment host and asset domains are fixed so Supabase Auth and Next.js are not broken.
- `robots.txt` allows the public home page and disallows `/app/`, `/onboarding`, `/auth/`, `/api/`, `/login`, and `/signup`. Private app pages also set `robots: { index: false }`.

## Logging and errors

- Do not log secrets, passwords, access tokens, refresh tokens, authorization headers, prompts, or full student submissions.
- Server diagnostics use `src/lib/security/log.ts` (and equivalent auth/account helpers). Production logs a scope, step, and error code. Provider messages are truncated and development-only.
- Do not return stack traces, SQL, prompts, or provider errors to the browser.
- User-facing errors stay generic, for example "Something went wrong. Please try again."

## Privacy and account deletion

Student study data is personal. Collect only what the current feature needs.

A student must be able to delete the account and the associated study data. The schema deletes owned rows when the Auth user is deleted. A student-facing delete control is not implemented. Backup retention still needs a decision.

## Dependencies

Add a dependency only when a phase needs it. Review it before adding it.

## Related documents

- [Architecture](architecture.md)
- [API](api.md)
- [Database](database.md)
- [AI system](ai-system.md)
- [Deployment](deployment.md)
- [README](../README.md)
