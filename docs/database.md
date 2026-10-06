# Database

Future data model for AI Study Future Planner. No application database is connected. Supabase Auth holds the account only. This file does not define tables, columns, indexes, or migrations.

Markdown in this repository is documentation. It must not store student records or be treated as a seed database.

## Current decision

Supabase Auth is connected for accounts only. The signed-in user is a Supabase Auth user. The full name is stored in user metadata as `full_name`. There is no profile table and no application schema.

Do not add tables, an ORM, a migration tool, or queries for Goals, Roadmaps, Study Plans, tasks, quizzes, performance, or the tutor until that phase is requested. The Supabase client in `src/lib/supabase` is for Auth. It is not an application database client.

## Access rules

- Queries run in server-side services, not in client components.
- The connection string is a server-only environment variable. Do not prefix it with `NEXT_PUBLIC_`.
- Do not commit credentials, dumps, or real student data.
- Application APIs call services. UI does not open database connections.
- A later separate backend may own the database. Keep queries out of presentation code so that move stays possible.

## Conceptual entities

These names describe the product. They are not a schema.

| Entity | Meaning |
| --- | --- |
| User | The authenticated student account. Today this is the Supabase Auth user, including `full_name` in user metadata. |
| Profile | Preferences and display details for one User. Not created. |
| Goal | The future outcome the student is studying toward. |
| Roadmap | The AI Future Roadmap generated for one Goal. |
| Roadmap Milestone | One ordered step on a Roadmap. |
| Study Plan | The followable plan derived from a Roadmap. |
| Study Session | A period of work recorded against a Study Plan. |
| Daily Task | A single piece of work for a day, belonging to a Study Plan. |
| Quiz | A practice set tied to recent study. |
| Quiz Question | One question in a Quiz. |
| Quiz Attempt | One student's answers and result for a Quiz. |
| Performance | A summary of progress, gaps, and consistency. |
| Progress | The student's position through a Goal, Roadmap, or Study Plan. |
| AI Tutor Conversation | A tutoring thread tied to the student and a Goal. |

## Conceptual relationships

- A User has one Profile.
- A User has zero or more Goals.
- A Goal has one current Roadmap. Older roadmaps may be kept later as history. That retention rule is not decided.
- A Roadmap has one or more Roadmap Milestones in order.
- A Roadmap has one current Study Plan.
- A Study Plan has zero or more Study Sessions and zero or more Daily Tasks.
- A Daily Task may be completed inside a Study Session.
- A Quiz is created from study context on a Study Plan or Daily Task.
- A Quiz has one or more Quiz Questions.
- A User has zero or more Quiz Attempts for a Quiz.
- Performance and Progress are derived from Daily Tasks, Study Sessions, Quiz Attempts, and plan completion. They are not a second source of truth that can disagree with those records.
- An AI Tutor Conversation belongs to one User and one Goal. Messages stay in that conversation.

An Adaptive Study Plan is a revision of the Study Plan for the same Goal. It is not a separate entity in this conceptual model until a later phase finds that history needs its own record.

## Not in this phase

Do not create a schema, migration, seed, or database project from this document.

## Related documents

- [Architecture](architecture.md)
- [API](api.md)
- [Security](security.md)
- [Product](product.md)
- [README](../README.md)
