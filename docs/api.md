# API

API strategy for AI Study Future Planner. One authenticated connectivity route exists. Study generation routes do not.

## Current surface

Next.js serves the landing page, `robots.txt`, and `sitemap.xml`. The only product route handler is `POST /api/ai/test`.

| Route | Auth | Purpose |
| --- | --- | --- |
| `POST /api/ai/test` | Signed-in Supabase user via `getAuthenticatedUser()` | Connectivity check through the OpenAI Responses API. It does not create a roadmap or write the database. |

The body is `{ "message": "..." }`. `message` is required, must be text, and must be 500 characters or fewer. Unknown fields are rejected. Success returns `{ "ok": true, "model": "...", "text": "..." }`. Failure returns `{ "ok": false, "error": { "code": "...", "message": "..." } }` with no stack trace, prompt, or secret.

## Client and server

| Responsibility | Client | Server |
| --- | --- | --- |
| Presentation and input | Yes | Render the initial page |
| Authentication decision | Send the request | Enforce it |
| Validation | May help the student | Must enforce it |
| Business rules | No secret rules | Yes |
| Database access | No | Services only |
| AI provider calls | No | Services only |

The browser never receives provider keys, database credentials, or session secrets.

## Target request flow

`POST /api/ai/test` uses this shape. Later study routes should keep it.

Client → Server API → Authentication → Validation → Business logic → AI or database → Response

1. The client sends only the fields the action needs.
2. The server confirms the student is allowed to act on that record.
3. The server validates the payload before any side effect.
4. Business logic decides what should happen.
5. A service reads or writes the database, or calls the AI provider.
6. The response is a typed success or a safe error.

Route handlers stay thin. Provider prompts and queries live in services. See [architecture.md](architecture.md).

## Authentication boundaries

Email and password authentication is implemented with Supabase Auth. `POST /api/ai/test` requires that session. Study generation routes are not built.

- Public routes remain the landing page, login, signup, and the auth callback.
- `/app` requires an authenticated student. It only confirms the session.
- `POST /api/ai/test` returns 401 when `getAuthenticatedUser()` finds no user.
- Study data routes, when they exist, require an authenticated student.
- A student can read and change only their own Goal, plan, tasks, attempts, and tutor conversations.
- Missing or invalid sessions receive an authorization error, not another student's data.

## Validation and errors

- Reject unknown or mistyped fields.
- Validate again on the server when the client already validated.
- Return a stable error shape the UI can show.
- Do not return stack traces, SQL, prompts, or provider payloads.
- Do not fill a failed AI or database call with fake student content.

## Authorization

Authorization is distinct from authentication. Signing in is not enough. The server checks that the record belongs to the signed-in student before it reads or writes it.

## Rate limiting

`POST /api/ai/test` allows 10 calls per signed-in user per 60 seconds. The count is kept in server memory and resets when the process restarts. A blocked call returns HTTP 429 and `error.code` `rate-limited`. An OpenAI 429 uses the same public code and does not include the provider payload. Sign-in limits are still not implemented.

## AI request flow

The connectivity check asks the server for one short reply. The server checks auth and input, calls OpenAI, and returns the text or a safe error. It does not store the reply. Later roadmap, plan, quiz, adaptation, and tutor routes must validate structured output before storing it. Details: [ai-system.md](ai-system.md).

## Database access

Only services use the database. Route handlers do not import a database client. Details: [database.md](database.md).

## Later replacement

If a separate backend replaces these routes, the UI should keep calling one server boundary. Do not scatter provider URLs through client components.

## Not in this phase

Do not add roadmap, plan, quiz, or tutor routes until those features are requested. Do not add a mock generator that pretends those results exist.

## Related documents

- [Architecture](architecture.md)
- [AI system](ai-system.md)
- [Security](security.md)
- [Database](database.md)
- [README](../README.md)
