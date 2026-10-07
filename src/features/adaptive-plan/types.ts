export type ScoreBand = "low" | "medium" | "high";

export type SkillArea = {
  skill: string;
  percent: number;
  correct: number;
  total: number;
  band: ScoreBand;
};

export type RecommendedTask = {
  title: string;
  skill: string;
  description: string;
  milestoneId: string;
  milestoneTitle: string;
  scheduledOn: string;
  durationMinutes: number;
  alreadyOnPlan: boolean;
};

export type Recommendation = {
  statusSummary: string;
  stageTitle: string;
  strongAreas: SkillArea[];
  weakAreas: SkillArea[];
  changes: string[];
  priorities: string[];
  tasks: RecommendedTask[];
  rationale: string;
};

export type SavedAdaptivePlan = {
  id: string;
  status: "draft" | "applied" | "discarded";
  createdAt: string;
};

export type AdaptiveReady = {
  status: "ready";
  planTitle: string;
  roadmapTitle: string;
  recommendation: Recommendation;
  saved: SavedAdaptivePlan | null;
};

export type AdaptiveLoad =
  | { status: "unauthenticated" }
  | { status: "incomplete" }
  | { status: "unavailable" }
  | { status: "no-roadmap" }
  | { status: "no-plan" }
  | { status: "insufficient" }
  | AdaptiveReady;

export type AdaptiveMutation =
  | { ok: true; added: number }
  | { ok: false; reason: "unauthenticated" | "insufficient" | "missing-plan" | "failed" };
