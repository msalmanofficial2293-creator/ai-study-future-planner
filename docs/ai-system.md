# AI system

This document will describe the AI architecture when a provider is integrated. No AI provider is connected in the foundation.

## Product role

AI is planned to support the learning journey: future roadmap, quizzes, adaptive changes to the study plan, and tutoring. Those features are not implemented. The home page only describes them.

## Rules for the later integration

- Call the provider from server-side services only.
- Store the API key in a server-only environment variable. Never use `NEXT_PUBLIC_`, never import the key into a client component, and never send the key to the browser.
- Do not choose or hardcode a provider until the AI phase defines one. Record the choice in this file at that time.
- Keep prompts, model settings, and response parsing in the AI service, separate from UI components.
- Validate and bound model output before it becomes a plan, quiz, or tutor message.
- Fail visibly when the provider is unavailable. Do not replace a failed AI response with fabricated student guidance.
- Log failures without recording the secret or unnecessary personal content.

## Not in this phase

Do not add an AI SDK, API key, prompt library, or simulated generation.

## Related documents

- [Product](product.md)
- [API](api.md)
- [Security](security.md)
- [README](../README.md)
