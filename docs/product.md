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

Goal → AI Future Roadmap → Study Plan → Daily Tasks → AI Quiz → Performance Tracking → Adaptive Study Plan → AI Tutor → AI Personalization

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
9. AI Personalization turns saved evidence into structured recommendations the student can apply or dismiss.

Onboarding can save a first Goal, and the Future Planner can show and update it. A signed-in student can generate a development roadmap from that goal. Study Plan turns that roadmap into tasks the student adds and completes. Daily Tasks shows the work for a day. AI Quiz checks that work with a development quiz. Performance Tracking shows progress from those saved tasks, attempts, and snapshots. Adaptive Study Plan can add tasks to the current plan from those results, using rules on the server. AI Tutor and AI Personalization also use that stored context with local generators and rules. None of these steps calls a paid AI provider.

## Main product areas

| Area | Role | Status |
| --- | --- | --- |
| Landing Page | Explain the product and the journey. | Implemented |
| Authentication | Identify the student before personal data is stored. | Implemented |
| User Onboarding | Collect the minimum context needed to start a goal. | Implemented |
| Future Planner | Where the student defines and revises a Goal. | Implemented |
| AI Future Roadmap | Ordered skills and milestones for that goal. A development generator writes the existing roadmap tables. It does not call a paid model. | Implemented |
| Study Plan | Tasks the student adds from the current roadmap, with weekly progress. It does not call a paid model or adapt itself. | Implemented |
| Daily Tasks | Today's work from the current study plan, with a daily completion count. It does not call a paid model. | Implemented |
| AI Quiz | Practice from the current roadmap and study plan. A development generator writes the existing quiz tables and a performance snapshot. It does not call a paid model or change the study plan. | Implemented |
| Performance Tracking | Progress, gaps, and consistency calculated from saved tasks, quiz attempts, and performance snapshots. It does not call a paid model or revise the study plan. | Implemented |
| Adaptive Study Plan | Rule-based changes to the current study plan from saved quiz scores. It does not call a paid model. | Implemented |
| AI Tutor | Guidance tied to the goal, roadmap, study plan, and saved quiz results. A development generator writes `tutor_conversations` and `tutor_messages`. It does not call a paid model. | Implemented |
| AI Personalization | Structured study recommendations from saved profile, roadmap, plan, tasks, and quiz results. Apply/dismiss decisions use `personalization_decisions`. It does not call a paid model. | Implemented |
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
- Presenting the development roadmap as output from a paid model.

## Current development phase

Foundation phase.

Implemented: the public landing page, application shell, visual system, environment structure, authentication, onboarding, the Future Planner, a development AI Future Roadmap, a Study Plan of tasks on that roadmap, Daily Tasks for that plan, a development AI Quiz, Performance Tracking for those saved results, profile editing, a server-only OpenAI connectivity check, documentation, and the PostgreSQL schema in `supabase/migrations`. Onboarding, the Future Planner, and the profile page use `profiles` and the first `goals` row. Future Planner also writes `roadmaps` and `roadmap_milestones`. Study Plan and Daily Tasks use `study_plans` and `study_tasks`. AI Quiz uses `quizzes`, `quiz_questions`, `quiz_attempts`, `quiz_answers`, and `performance_records`. Performance Tracking reads those rows and the roadmap milestones. Task completion also writes a `performance_records` snapshot. Adaptive Study Plan reads that evidence and writes `adaptive_plans` plus any applied `study_tasks` rows. AI Tutor reads that context and writes `tutor_conversations` and `tutor_messages` through a local generator. AI Personalization reads that context through local rules and writes apply/dismiss decisions in `personalization_decisions`.

Not started: account deletion, and replacing the development roadmap, quiz, adaptive rules, tutor generator, or personalization rules with a paid model.

## Related documents

- [Features](features.md)
- [UI design](ui-design.md)
- [AI system](ai-system.md)
- [README](../README.md)
