# AI system

Server-side OpenAI boundary for AI Study Future Planner. The client and a connectivity check exist. Future Planner generates a development roadmap through `createRoadmapGenerator()` and does not call this client. Study Plan and Daily Tasks save tasks without a model. AI Quiz generates development questions through `createQuizGenerator()` and does not call this client. Performance Tracking reads saved tasks, attempts, and snapshots and does not call this client. Adaptive Study Plan applies server-side rules to those saved results and does not call this client. AI Tutor replies through `createTutorGenerator()` and does not call this client.

## Role in the product

AI supports the learning journey. It does not replace the journey with an open-ended chat.

The journey remains:

Goal → AI Future Roadmap → Study Plan → Daily Tasks → AI Quiz → Performance Tracking → Adaptive Study Plan → AI Tutor

## Planned capabilities

| Capability | What it supports |
| --- | --- |
| Future goal analysis | Clarify the Goal before a roadmap is generated. |
| Career and learning roadmap generation | Produce the AI Future Roadmap and its milestones. |
| Study plan generation | Turn the roadmap into a Study Plan. |
| Daily task generation | Propose Daily Tasks from the current plan. |
| Quiz generation | A development generator already writes local questions from the study plan. A paid model is not connected. |
| Performance analysis | The performance page reads stored tasks, attempts, and snapshots. It does not call a model. |
| Adaptive planning | The adaptive page revises later tasks from saved scores with server-side rules. A paid model is not connected. |
| AI tutoring | The tutor page answers from saved study context with a local generator. A paid model is not connected. |

Performance Tracking displays stored history without a model call. Adaptive planning uses saved scores and local rules. It does not call this client.

## Required flow

The connectivity check follows this path. Study generation does not yet store a result.

User → Web UI or `POST /api/ai/test` → Secure server API → OpenAI Responses API → Safe response

1. The caller sends only the fields the action needs. The browser does not call OpenAI.
2. The server confirms a signed-in Supabase user with `getAuthenticatedUser()`.
3. The server validates the payload before any provider call.
4. `src/services/ai.ts` sends the request with the server API key.
5. Later study features must validate structured output before storing it.
6. Invalid or unavailable output produces an error state. It is not replaced with fabricated study guidance.

`POST /api/ai/test` asks for one short confirmation sentence. It does not create a roadmap, plan, quiz, or database row.

## Key handling

The AI API key must never be exposed to the browser.

- Provider: OpenAI, through the official `openai` package and the Responses API.
- Key: `OPENAI_API_KEY`, read only in `src/lib/ai/config.ts`.
- Model: `OPENAI_MODEL`. When it is unset, the server uses `gpt-4.1-mini`.
- Do not use the `NEXT_PUBLIC_` prefix.
- Do not import the key into a client component, `src/config/env.ts`, or documentation.
- Do not return it in an API response or a log.
- The service sets the SDK log level to off and pins the base URL to `https://api.openai.com/v1`.
- `import "server-only"` guards the config, service, and AI feature modules.

## Validation

AI-generated content must be validated before it is stored or displayed as a roadmap, plan, task list, quiz, adaptation, or tutor message.

- Parse the response into the expected structure.
- Reject missing milestones, empty tasks, or quiz items that do not match the request.
- Bound length and count so one response cannot flood the database or the page.
- Keep prompts, model settings, and parsing in the AI service, not in UI components.

## Failure and logging

- Show a clear failure when the provider is unavailable or the output is invalid.
- Log the failure without the API key, the full prompt when it contains personal study detail, or the raw secret configuration.
- Do not log more student content than an operator needs to diagnose the failure.

## Not in this phase

The Future Planner roadmap, the AI Quiz, and the AI Tutor are local development generators. They are not model output. Tutor replies are stored in `tutor_messages`. Storing model output is not implemented. Do not treat the connectivity check as a study result. Replace `createRoadmapGenerator()`, `createQuizGenerator()`, or `createTutorGenerator()` when a later task connects that step to OpenAI. The tutor generator is the only piece that should change. Context loading, conversation storage, and the page stay as they are.

## Related documents

- [API](api.md)
- [Security](security.md)
- [Product](product.md)
- [Features](features.md)
- [README](../README.md)
