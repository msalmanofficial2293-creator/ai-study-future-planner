import "server-only";

export const DEFAULT_AI_MODEL = "gpt-4.1-mini";

export const AI_REQUEST_TIMEOUT_MS = 20_000;

const MODEL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

const KEY_PATTERN = /^sk-[A-Za-z0-9_-]{16,220}$/;

export type AiConfigResult =
  | { ok: true; apiKey: string; model: string }
  | { ok: false; code: "missing-key" | "invalid-config"; message: string };

export function readAiConfig(): AiConfigResult {
  const rawKey = process.env.OPENAI_API_KEY;
  const rawModel = process.env.OPENAI_MODEL;

  if (rawKey === undefined || rawKey.trim().length === 0) {
    return {
      ok: false,
      code: "missing-key",
      message: "OpenAI is not configured. Set OPENAI_API_KEY in the server environment.",
    };
  }

  const apiKey = rawKey.trim();

  if (!KEY_PATTERN.test(apiKey)) {
    return {
      ok: false,
      code: "invalid-config",
      message: "OPENAI_API_KEY is set but is not a usable server key.",
    };
  }

  const model = rawModel?.trim() ?? "";

  if (model.length === 0) {
    return { ok: true, apiKey, model: DEFAULT_AI_MODEL };
  }

  if (!MODEL_PATTERN.test(model)) {
    return {
      ok: false,
      code: "invalid-config",
      message: "OPENAI_MODEL is not a valid model id.",
    };
  }

  return { ok: true, apiKey, model };
}

export function describeAiConfig():
  | { ok: true }
  | { ok: false; code: "missing-key" | "invalid-config"; message: string } {
  const config = readAiConfig();

  if (!config.ok) {
    return config;
  }

  return { ok: true };
}
