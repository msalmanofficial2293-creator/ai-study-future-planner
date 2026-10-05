# AI system

Future AI architecture for AI Study Future Planner. No provider is connected. Do not add an SDK, API key, prompt library, or simulated generation in the foundation phase.

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
| Quiz generation | Produce an AI Quiz from recent study. |
| Performance analysis | Explain gaps and consistency from stored results. |
| Adaptive planning | Revise the Study Plan from performance evidence. |
| AI tutoring | Answer inside an AI Tutor conversation tied to the Goal. |

Performance Tracking can display stored history without a model call. Analysis and adaptation use the server AI boundary.

## Required flow

This flow is not implemented.

User → Web UI → Secure server API → AI provider → Validation and structured response → Database → User

1. The student acts in the web UI.
2. The UI calls a server API. It does not call the provider.
3. The server checks authentication, authorization, and input.
4. A server-side service sends the prompt with the AI API key.
5. The service validates the structured response.
6. Valid output may be stored and then shown.
7. Invalid or unavailable output produces an error state. It is not replaced with fabricated study guidance.

## Key handling

The AI API key must never be exposed to the browser.

- Store it in a server-only environment variable.
- Do not use the `NEXT_PUBLIC_` prefix.
- Do not import it into a client component, a public config module, or documentation.
- Do not return it in an API response or a log.

No provider is chosen. Record the provider, model, and environment variable name in this file when the AI phase selects them.

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

Do not integrate a provider, choose a model, or add a fake generator that pretends to be AI.

## Related documents

- [API](api.md)
- [Security](security.md)
- [Product](product.md)
- [Features](features.md)
- [README](../README.md)
