# Features

This document tracks what the product will contain and what is implemented. Status here is planning context, not stored user data.

## Implemented

| Area | Status | What exists |
| --- | --- | --- |
| Application foundation | In place | Next.js, TypeScript, Tailwind CSS, ESLint, env structure, documentation. |
| Public home page | In place | Introduces the product, the learning sequence, and the approach. |
| Global error and not-found pages | In place | A recoverable error view and a 404 view. |

The home page does not save input, call an API, or generate a plan.

## Planned

These follow the product journey. None of them are started.

| Feature | Intent |
| --- | --- |
| Goal | A student defines the future outcome they are studying toward. |
| AI Future Roadmap | The goal becomes an ordered path of skills and milestones. |
| Study Plan | The roadmap becomes a plan the student can follow. |
| Daily Tasks | The plan becomes focused work for a day. |
| AI Quiz | Practice checks understanding of recent study. |
| Performance Tracking | The student can see progress, gaps, and consistency. |
| Adaptive Study Plan | Results change what the student should do next. |
| AI Tutor | Guidance stays tied to the student's goal and recent work. |

Build these only when a task asks for that phase. Do not scaffold their screens, routes, or fake data ahead of time.

## Related documents

- [Product](product.md)
- [Architecture](architecture.md)
- [README](../README.md)
