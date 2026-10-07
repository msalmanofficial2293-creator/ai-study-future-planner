# Product

Specification for AI Study Future Planner. This file is context for development. It is not a data store.

## Product name

AI Study Future Planner

## Product purpose

Help a student turn one future goal into a structured learning journey, then keep study, practice, and review connected to that goal.

## Target users

Students who want a clear path from a future outcome to daily study. The first product is for an individual student, not for a school administration system.

## Core problem

A goal is easy to name and hard to study toward. Plans, tasks, practice, and feedback often live in separate tools, so the work drifts away from the outcome the student chose.

## Product solution

One journey, in this order:

Goal → AI Future Roadmap → Study Plan → Daily Tasks → AI Quiz → Performance Tracking → Adaptive Study Plan → AI Tutor

Each stage uses the same goal. Later stages can change the plan when practice shows a gap.

## Product vision

A student should be able to say what future they are studying for, see the path, do the day's work, check understanding, and receive guidance that stays on that path. The product should feel calm, precise, and trustworthy. It is not a general-purpose chatbot.

## Core user journey

1. The student defines a Goal.
2. The product produces an AI Future Roadmap of skills and milestones.
3. That roadmap becomes a Study Plan.
4. The plan becomes Daily Tasks.
5. An AI Quiz checks what the student just studied.
6. Performance Tracking shows progress, gaps, and consistency.
7. An Adaptive Study Plan changes later work from those results.
8. An AI Tutor answers in the context of the goal and the work already done.

Onboarding can save a first Goal, and the Future Planner can show and update it. A server-side OpenAI connectivity check exists. The student cannot generate a roadmap yet.

## Main product areas

| Area | Role | Status |
| --- | --- | --- |
| Landing Page | Explain the product and the journey. | Implemented |
| Authentication | Identify the student before personal data is stored. | Implemented |
| User Onboarding | Collect the minimum context needed to start a goal. | Implemented |
| Future Planner | Where the student defines and revises a Goal. | Implemented |
| AI Future Roadmap | Ordered skills and milestones for that goal. | Planned |
| Study Plan | A followable plan derived from the roadmap. | Planned |
| Daily Tasks | Focused work for a day. | Planned |
| AI Quiz | Practice tied to recent study. | Planned |
| Performance Tracking | Progress, gaps, and consistency. | Planned |
| Adaptive Study Plan | A revised plan based on performance. | Planned |
| AI Tutor | Guidance tied to the goal and recent work. | Planned |
| Profile and Settings | View and update profile, goal, password, and notification details. Account deletion and password recovery are not built. | Profile editing implemented |

Behavior for each area is in [features.md](features.md). Do not build a planned area unless a task asks for it.

## Future monetization considerations

Monetization is not decided and is not implemented. There is no payment system.

A later business decision may consider a free student journey and optional paid capacity, such as longer plans or more tutor use. School or family plans are possible later audiences, not current features. Any payment work needs its own phase, its own security review, and an update to this document. Do not add a provider, prices, or checkout while building the foundation or the learning journey.

## Non-goals

- A general-purpose chat product.
- A visual or interaction copy of ChatGPT, Gauth, Notion, Google Classroom, or another existing product.
- A school information system, grade book, or classroom manager.
- Using Markdown files as a database for student records.
- Pretending generated content exists when no AI provider is connected.

## Current development phase

Foundation phase.

Implemented: the public landing page, application shell, visual system, environment structure, authentication, onboarding, the Future Planner, profile editing, a server-only OpenAI connectivity check, documentation, and the PostgreSQL schema in `supabase/migrations`. Onboarding, the Future Planner, and the profile page use `profiles` and the first `goals` row. The other study tables are not queried yet.

Not started: roadmap generation, study plans, tasks, quizzes, tracking, adaptive planning, tutoring, and account deletion.

## Related documents

- [Features](features.md)
- [UI design](ui-design.md)
- [AI system](ai-system.md)
- [README](../README.md)
