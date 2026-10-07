import "server-only";

import OpenAI from "openai";
import { AI_REQUEST_TIMEOUT_MS, readAiConfig } from "@/lib/ai/config";

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const MIN_OUTPUT_TOKENS = 16;
const MAX_OUTPUT_TOKENS = 2_000;
const MAX_INSTRUCTIONS_LENGTH = 2_000;
const MAX_INPUT_LENGTH = 8_000;
const MAX_RETURNED_TEXT_LENGTH = 4_000;

export type AiErrorCode =
  | "missing-key"
  | "invalid-config"
  | "rate-limited"
  | "timeout"
  | "provider-error"
  | "unexpected";

export type AiError = {
  code: AiErrorCode;
  status: number;
  message: string;
};

export type AiTextRequest = {
  instructions: string;
  input: string;
  maxOutputTokens: number;
};

export type AiTextResult =
  | { ok: true; model: string; text: string }
  | { ok: false; error: AiError };

const STATUS: Record<AiErrorCode, number> = {
  "missing-key": 503,
  "invalid-config": 503,
  "rate-limited": 429,
  timeout: 504,
  "provider-error": 502,
  unexpected: 500,
};

const MESSAGE: Record<AiErrorCode, string> = {
  "missing-key": "OpenAI is not configured. Set OPENAI_API_KEY in the server environment.",
  "invalid-config": "The server AI configuration was rejected.",
  "rate-limited": "The AI provider is busy. Please wait and try again.",
  timeout: "The AI provider did not respond in time. Please try again.",
  "provider-error": "The AI provider could not complete the request.",
  unexpected: "Something went wrong. Please try again.",
};

export async function createAiTextResponse(request: AiTextRequest): Promise<AiTextResult> {
  if (
    request.instructions.trim().length === 0 ||
    request.instructions.length > MAX_INSTRUCTIONS_LENGTH ||
    request.input.trim().length === 0 ||
    request.input.length > MAX_INPUT_LENGTH
  ) {
    return failure("unexpected", "The AI request is incomplete.");
  }

  const config = readAiConfig();

  if (!config.ok) {
    return failure(config.code, config.message);
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: OPENAI_BASE_URL,
    timeout: AI_REQUEST_TIMEOUT_MS,
    maxRetries: 0,
    logLevel: "off",
  });

  try {
    const response = await client.responses.create({
      model: config.model,
      instructions: request.instructions,
      input: request.input,
      max_output_tokens: clampOutputTokens(request.maxOutputTokens),
      store: false,
    });

    if (response.error) {
      if (response.error.code === "rate_limit_exceeded") {
        logAiDiagnostic("rate-limited", response.error.code);
        return failure("rate-limited");
      }

      logAiDiagnostic("provider-error", response.error.code);
      return failure("provider-error");
    }

    const text = response.output_text.trim().slice(0, MAX_RETURNED_TEXT_LENGTH);

    if (text.length === 0) {
      logAiDiagnostic("provider-error", "empty-output");
      return failure("provider-error");
    }

    const model = typeof response.model === "string" && response.model.length > 0
      ? response.model
      : config.model;

    return { ok: true, model, text };
  } catch (error) {
    return mapThrownError(error);
  }
}

function clampOutputTokens(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_OUTPUT_TOKENS;
  }

  return Math.min(MAX_OUTPUT_TOKENS, Math.max(MIN_OUTPUT_TOKENS, Math.floor(value)));
}

function mapThrownError(error: unknown): AiTextResult {
  if (error instanceof OpenAI.APIConnectionTimeoutError || error instanceof OpenAI.APIUserAbortError) {
    logAiDiagnostic("timeout", null);
    return failure("timeout");
  }

  if (error instanceof OpenAI.APIConnectionError) {
    logAiDiagnostic("timeout", "connection");
    return failure("timeout");
  }

  if (error instanceof OpenAI.RateLimitError) {
    logAiDiagnostic("rate-limited", error.status);
    return failure("rate-limited");
  }

  if (error instanceof OpenAI.AuthenticationError || error instanceof OpenAI.PermissionDeniedError) {
    logAiDiagnostic("invalid-config", error.status);
    return failure("invalid-config");
  }

  if (error instanceof OpenAI.APIError) {
    logAiDiagnostic("provider-error", error.status);
    return failure("provider-error");
  }

  logAiDiagnostic("unexpected", null);
  return failure("unexpected");
}

function failure(code: AiErrorCode, message?: string): AiTextResult {
  return {
    ok: false,
    error: {
      code,
      status: STATUS[code],
      message: message ?? MESSAGE[code],
    },
  };
}

function logAiDiagnostic(step: string, detail: string | number | null) {
  if (process.env.NODE_ENV === "production") {
    console.error(`[ai:${step}]`);
    return;
  }

  console.error(`[ai:${step}] ${detail ?? "none"}`);
}
