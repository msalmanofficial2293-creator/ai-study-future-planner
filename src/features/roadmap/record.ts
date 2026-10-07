import type { RoadmapDraft, RoadmapStage } from "@/features/roadmap/types";

export function encodeRoadmapSummary(draft: Pick<RoadmapDraft, "overview" | "timeline" | "nextSteps">): string {
  const steps = draft.nextSteps.map((step) => `- ${step}`).join("\n");
  return `OVERVIEW\n${draft.overview}\n\nTIMELINE\n${draft.timeline}\n\nNEXT\n${steps}`;
}

export function encodeMilestoneDescription(stage: RoadmapStage): string {
  const skills = stage.skills.map((skill) => `- ${skill}`).join("\n");
  return `SKILLS\n${skills}\n\nMILESTONE\n${stage.milestone}`;
}

export function decodeRoadmapSummary(summary: string): {
  overview: string;
  timeline: string;
  nextSteps: string[];
} {
  const overview = section(summary, "OVERVIEW", "TIMELINE");
  const timeline = section(summary, "TIMELINE", "NEXT");
  const next = section(summary, "NEXT", null);
  const nextSteps = next
    .split("\n")
    .map((line) => line.replace(/^- /, "").trim())
    .filter((line) => line.length > 0);

  if (!overview || !timeline || nextSteps.length === 0) {
    return {
      overview: summary.trim() || "Overview is not available.",
      timeline: "Timeline is not available.",
      nextSteps: ["Open the goal and generate the roadmap again."],
    };
  }

  return { overview, timeline, nextSteps };
}

export function decodeMilestoneDescription(description: string): {
  skills: string[];
  milestone: string;
} {
  const skillsBlock = section(description, "SKILLS", "MILESTONE");
  const milestone = section(description, "MILESTONE", null);
  const skills = skillsBlock
    .split("\n")
    .map((line) => line.replace(/^- /, "").trim())
    .filter((line) => line.length > 0);

  if (skills.length === 0 || milestone.length === 0) {
    return {
      skills: ["Skill details are not available."],
      milestone: description.trim() || "Milestone details are not available.",
    };
  }

  return { skills, milestone };
}

function section(source: string, start: string, end: string | null): string {
  const startToken = `${start}\n`;
  const startIndex = source.indexOf(startToken);

  if (startIndex < 0) {
    return "";
  }

  const contentStart = startIndex + startToken.length;
  const endIndex = end ? source.indexOf(`\n\n${end}\n`, contentStart) : -1;
  const content = endIndex < 0 ? source.slice(contentStart) : source.slice(contentStart, endIndex);
  return content.trim();
}
