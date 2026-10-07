import "server-only";

import { generateMockRoadmap } from "@/features/roadmap/mock-generator";
import type { RoadmapDraft, RoadmapLearnerInput } from "@/features/roadmap/types";

export type RoadmapGenerator = {
  generate(input: RoadmapLearnerInput): Promise<RoadmapDraft>;
};

export function createRoadmapGenerator(): RoadmapGenerator {
  return {
    async generate(input) {
      return generateMockRoadmap(input);
    },
  };
}
