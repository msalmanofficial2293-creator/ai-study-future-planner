import "server-only";

import { generateMockTutorReply } from "@/features/tutor/mock-generator";
import type { TutorContext } from "@/features/tutor/types";

export type TutorGenerator = {
  reply(question: string, context: TutorContext): string;
};

export function createTutorGenerator(): TutorGenerator {
  // Development replies stay local. A later generator can call src/services/ai.ts.
  return {
    reply: generateMockTutorReply,
  };
}
