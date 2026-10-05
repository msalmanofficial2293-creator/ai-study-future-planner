# API

Future API strategy for AI Study Future Planner. No product API routes exist.

## Current surface

Next.js serves the landing page, `robots.txt`, and `sitemap.xml`. There is no `src/app/api` route. The landing page does not call a backend.

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

This flow is the intended design. It is not implemented.

Client → Server API → Authentication → Validation → Business logic → AI or database → Response

1. The client sends only the fields the action needs.
2. The server confirms the student is allowed to act on that record.
3. The server validates the payload before any side effect.
4. Business logic decides what should happen.
5. A service reads or writes the database, or calls the AI provider.
6. The response is a typed success or a safe error.

Route handlers stay thin. Provider prompts and queries live in services. See [architecture.md](architecture.md).

## Authentication boundaries

Authentication is not implemented. When it exists:

- Public routes remain the landing page and other explicitly public pages.
- Study data routes require an authenticated student.
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

Not implemented. When AI or account routes exist, limit repeated generation, sign-in attempts, and other expensive calls per student and per address. Record the chosen limit in this file at that time. A limit response must be understandable to the student.

## AI request flow

The client asks the server for a roadmap, plan, quiz, adaptation, or tutor reply. The server checks auth and input, calls the provider, validates the structured result, then stores or returns it. Details: [ai-system.md](ai-system.md).

## Database access

Only services use the database. Route handlers do not import a database client. Details: [database.md](database.md).

## Later replacement

If a separate backend replaces these routes, the UI should keep calling one server boundary. Do not scatter provider URLs through client components.

## Not in this phase

Do not add route handlers, mock servers, or fake JSON endpoints.

## Related documents

- [Architecture](architecture.md)
- [AI system](ai-system.md)
- [Security](security.md)
- [Database](database.md)
- [README](../README.md)
