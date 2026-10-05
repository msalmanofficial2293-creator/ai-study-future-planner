# Testing

QA strategy for AI Study Future Planner. No automated test runner is installed. Do not add one in a phase that has no behavior to test.

## Current checks

From the repository root:

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run dev` serves the landing page at [http://localhost:3000](http://localhost:3000).

Verify the landing page when its UI changes:

- The product name, learning sequence, and approach render.
- Keyboard users can skip to content and see a focus state.
- Layout remains usable on a phone, a tablet, and a desktop.
- An unknown route shows the not-found page.
- The page has a title and description.

## Intended test layers

Add a layer when a feature needs it. Record the tool and the command in this file at that time.

| Layer | What it should cover |
| --- | --- |
| Unit testing | Pure business rules, env parsing, and response validation. |
| Integration testing | A service with its database or AI boundary, using test doubles for external providers. |
| Component testing | Shared UI states: default, loading, empty, error, and disabled. |
| End-to-end testing | A student path such as sign-in through creating a Goal, once those features exist. |
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
| Local validation | `lint`, `typecheck`, and `build` are available. |
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
