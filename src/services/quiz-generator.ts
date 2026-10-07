import "server-only";

import { generateMockQuiz } from "@/features/quiz/mock-generator";
import type { MockQuiz, MockQuizInput } from "@/features/quiz/types";

export type QuizGenerator = {
  generate(input: MockQuizInput): MockQuiz;
};

export function createQuizGenerator(): QuizGenerator {
  return {
    generate: generateMockQuiz,
  };
}
