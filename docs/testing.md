# Testing

QA strategy for AI Study Future Planner. No automated test runner is installed. Do not add a large framework only for checklist coverage.

## Current checks

From the repository root:

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run dev` serves the app at [http://localhost:3000](http://localhost:3000).

## Full application QA (2026-10-08)

Manual regression was run against the live local app with an authenticated student account and mock AI. Automated unit/e2e suites were **not** added (none existed). Results below reflect what was actually executed.

### Modules exercised

| Module | How tested | Result |
| --- | --- | --- |
| Landing / SEO | Browser + `robots.txt` HTTP | PASS (after robots/canonical fixes) |
| Auth gate | Unauthenticated `GET /app/study-plan` → 307 `/login` | PASS |
| Login / signup pages | HTTP 200 while signed out | PASS |
| Account hub | Browser load + onboarding gate | PASS |
| Profile | Browser load (personal, education, goals, password, prefs) | PASS |
| Future Planner + roadmap | Browser load of goal + stored mock roadmap | PASS |
| Study Plan | Browser load, tasks, weekly progress | PASS |
| Daily Tasks | Browser load; progress vs overdue board | FIXED then PASS |
| AI Quiz dashboard + review | Browser history + attempt review | PASS |
| Performance | Browser metrics from saved tasks/quizzes | PASS |
| Adaptive Study Plan | Browser HIGH-score → next skill | PASS |
| AI Tutor | Suggested prompt, loading, mock reply, history | PASS |
| Personalization | Browser overview + recommendations from real data | PASS |
| Navigation / footer | Product hash links from app pages | FIXED then PASS |
| Lint / TypeScript / build | `npm run lint`, `typecheck`, `build` | PASS |

### Fixes from this QA pass

- `todayIso()` now uses the runtime local calendar date (not UTC `toISOString` day).
- Daily progress counts overdue/due-today board work, not only `scheduledOn === today`.
- Performance empty state only when there are no tasks and no quiz attempts.
- Site/footer copy no longer claims study tools are “not open yet”.
- Footer/header product links use `/#…` and `Link` so they work from `/app/*`.
- Root layout no longer forces `canonical: "/"` onto every page; home sets canonical.
- `robots.txt` disallows `/app/`, `/onboarding`, `/auth/`, `/api/`, `/login`, `/signup`.
- Account and profile redirect incomplete users to onboarding.
- Tutor conversation delete controls expose unique `aria-label`s.
- Client date formatting uses `en-US` to reduce SSR/client hydration mismatches.

### Not fully automated / still manual

- Full signup/login/logout form matrix (invalid email, mismatch, duplicate) against live Auth.
- Two-user RLS isolation with a second real account (policies reviewed in migrations; cross-user probe not re-run in this pass).
- Exhaustive quiz start → answer → submit → score path end-to-end in the browser (review of a prior attempt was verified).
- Password change and notification preference save against Auth.
- Exhaustive viewport matrix (320–1440); layouts were inspected on the default browser width and code reviewed for overflow patterns.
- Deployed staging/production verification (local only).

### Known limitations

- Server “today” follows the Node process timezone. On UTC hosts (typical serverless), early-morning local days can still disagree with the student’s wall clock until a per-user timezone exists.
- Account deletion UI remains unavailable by design.
- Mock AI remains the default; paid OpenAI is optional and server-only.
- No CI test runner yet.

## Intended test layers

Add a layer when a feature needs it. Record the tool and the command in this file at that time.

| Layer | What it should cover |
| --- | --- |
| Unit testing | Pure business rules, env parsing, and response validation. |
| Integration testing | A service with its database or AI boundary, using test doubles for external providers. |
| Component testing | Shared UI states: default, loading, empty, error, and disabled. |
| End-to-end testing | A student path such as sign-in through creating a Goal. |
| API testing | Auth, validation, authorization, and error shapes for route handlers. |
| Accessibility testing | Keyboard access, names, focus, contrast, and headings on changed screens. |
| Responsive testing | Phone, tablet, and desktop for changed layout. |
| Security testing | Secret handling, authorization, input rejection, and safe error responses. |
| Performance testing | Page and API response times once real data and AI calls exist. |

Feature work that fetches or submits data must cover loading, empty, success, and error paths.

## Release path

Intended sequence:

Development → Local validation → Pull request → CI checks → Staging → Production

| Stage | Status |
| --- | --- |
| Development | In use on a local machine. |
| Local validation | `lint`, `typecheck`, and `build` are available; full manual QA recorded above. |
| Pull request | The GitHub repository exists. Required review checks are not configured in this phase. |
| CI checks | Not set up. |
| Staging | Not set up. |
| Production | Not deployed. |

Do not claim CI, staging, or production verification has happened.

## Related documents

- [Deployment](deployment.md)
- [UI design](ui-design.md)
- [Security](security.md)
- [README](../README.md)
