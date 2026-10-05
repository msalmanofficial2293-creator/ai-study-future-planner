# Testing

This document describes how to check the project. No automated test runner is installed in the foundation.

## Checks for this phase

Run these from the repository root:

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run dev` must start the site and serve the home page at [http://localhost:3000](http://localhost:3000).

## What to verify on the home page

- The page renders the product name, the learning sequence, and the approach.
- Keyboard users can skip to content and see a focus state.
- Layout remains usable at phone, tablet, and desktop widths.
- Unknown routes show the not-found page.
- The page has a title and description.

## Later testing

Add an automated test runner when a feature needs unit, integration, or end-to-end coverage. Record the tool and the required commands here at that time. Do not add a test framework during a phase that has no behavior to test.

Feature work should cover loading, empty, success, and error paths when that feature fetches or submits data.

## Related documents

- [Deployment](deployment.md)
- [UI design](ui-design.md)
- [README](../README.md)
