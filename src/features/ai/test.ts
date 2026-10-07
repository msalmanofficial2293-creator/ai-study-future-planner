import "server-only";

import { createAiTextResponse, type AiTextResult } from "@/services/ai";

const TEST_INSTRUCTIONS =
  "You are a connectivity check for AI Study Future Planner. Reply with one short sentence confirming that you received the message. Do not create a roadmap, study plan, quiz, or tutor answer.";

const TEST_MAX_OUTPUT_TOKENS = 256;

export function runAiConnectivityCheck(message: string): Promise<AiTextResult> {
  return createAiTextResponse({
    instructions: TEST_INSTRUCTIONS,
    input: message,
    maxOutputTokens: TEST_MAX_OUTPUT_TOKENS,
  });
}
