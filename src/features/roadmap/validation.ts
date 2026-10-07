import type { RoadmapDraft } from "@/features/roadmap/types";

const TITLE_MAX = 180;
const OVERVIEW_MAX = 700;
const TIMELINE_MAX = 160;
const STAGE_TITLE_MAX = 120;
const SKILL_MAX = 160;
const MILESTONE_MAX = 400;
const STEP_MAX = 200;

export function validateRoadmapDraft(draft: RoadmapDraft): string | null {
  if (!bounded(draft.title, TITLE_MAX)) {
    return "The roadmap title is not usable.";
  }

  if (!bounded(draft.overview, OVERVIEW_MAX) || !bounded(draft.timeline, TIMELINE_MAX)) {
    return "The roadmap summary is not usable.";
  }

  if (draft.stages.length < 1 || draft.stages.length > 8) {
    return "The roadmap stages are not usable.";
  }

  for (const stage of draft.stages) {
    if (!bounded(stage.title, STAGE_TITLE_MAX) || !bounded(stage.milestone, MILESTONE_MAX)) {
      return "A roadmap stage is not usable.";
    }

    if (stage.skills.length < 1 || stage.skills.length > 6) {
      return "A roadmap stage is not usable.";
    }

    if (stage.skills.some((skill) => !bounded(skill, SKILL_MAX))) {
      return "A roadmap stage is not usable.";
    }
  }

  if (draft.nextSteps.length < 1 || draft.nextSteps.length > 6) {
    return "The recommended next steps are not usable.";
  }

  if (draft.nextSteps.some((step) => !bounded(step, STEP_MAX))) {
    return "The recommended next steps are not usable.";
  }

  return null;
}

function bounded(value: string, max: number): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= max;
}
