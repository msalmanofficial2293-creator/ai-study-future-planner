import "server-only";

export const AI_TEST_MESSAGE_MAX_LENGTH = 500;

export type AiTestInput =
  | { ok: true; message: string }
  | { ok: false; message: string };

export function parseAiTestBody(body: unknown): AiTestInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, message: "Send a JSON object with a message." };
  }

  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);

  if (keys.length !== 1 || keys[0] !== "message") {
    return { ok: false, message: "Send only a message field." };
  }

  const value = record.message;

  if (typeof value !== "string") {
    return { ok: false, message: "Message must be text." };
  }

  const message = value.trim();

  if (message.length === 0) {
    return { ok: false, message: "Message is required." };
  }

  if (message.length > AI_TEST_MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      message: `Message must be ${AI_TEST_MESSAGE_MAX_LENGTH} characters or fewer.`,
    };
  }

  return { ok: true, message };
}
