# Database

This document will hold database decisions when that phase starts. No database is connected in the foundation.

## Current decision

User data is not stored yet. Markdown files in this repository are documentation only. They must not be used as a production database, a seed file for student records, or a place to keep personal information.

## Rules for the later database phase

- Choose and document the production database in this file before writing queries.
- Keep database access in server-side services, not in client components.
- Store the connection string in a server-only environment variable. Never prefix it with `NEXT_PUBLIC_`.
- Do not commit credentials, dumps, or real student data.
- Design the schema around the product journey in [Product](product.md): goals, plans, tasks, practice, and progress. Record the actual schema here when it is decided.
- Plan for a separate backend service later. Avoid scattering data access through UI components.

## Not in this phase

Do not add a database client, ORM, migration tool, or hosted database project until a task asks for that phase.

## Related documents

- [Architecture](architecture.md)
- [Security](security.md)
- [API](api.md)
- [README](../README.md)
