import type { LearningStyle, SkillLevel, WeeklyStudyTime } from "@/features/onboarding/options";

export type ScoreBand = "low" | "medium" | "high";

export type DifficultyRecommendation = "beginner" | "practice" | "advanced";

export type TaskTypeRecommendation =
  | "revision"
  | "practice"
  | "new_concept"
  | "quiz"
  | "weak_topic"
  | "review"
  | "next_skill";

export type PersonalizedSkillArea = {
  skill: string;
  percent: number;
  correct: number;
  total: number;
  band: ScoreBand;
};

export type PersonalizationActionTask = {
  title: string;
  skill: string;
  description: string;
  milestoneId: string;
  scheduledOn: string;
  durationMinutes: number;
};

export type PersonalizedRecommendation = {
  fingerprint: string;
  kind: TaskTypeRecommendation;
  title: string;
  summary: string;
  reasoning: string;
  skill: string | null;
  difficulty: DifficultyRecommendation;
  alreadyOnPlan: boolean;
  task: PersonalizationActionTask | null;
  status: "open" | "applied" | "dismissed";
};

export type PersonalizationResult = {
  currentFocus: string;
  strongAreas: PersonalizedSkillArea[];
  weakAreas: PersonalizedSkillArea[];
  recommendedPriority: string;
  recommendedDifficulty: DifficultyRecommendation;
  recommendedLearningApproach: string;
  recommendedNextStep: string;
  careerAlignment: string;
  revisionFrequency: string;
  recommendedTaskType: TaskTypeRecommendation;
  quizDifficultyHint: DifficultyRecommendation;
  statusSummary: string;
  reasoning: string[];
  recommendations: PersonalizedRecommendation[];
};

export type PersonalizationProfile = {
  educationLabel: string | null;
  field: string | null;
  skillLevel: SkillLevel | null;
  skillLabel: string | null;
  learningStyle: LearningStyle | null;
  learningLabel: string | null;
  weeklyStudyTime: WeeklyStudyTime | null;
  weeklyLabel: string | null;
  goalTitle: string | null;
  targetOutcome: string | null;
};

export type PersonalizationTutorSummary = {
  currentFocus: string;
  recommendedPriority: string;
  recommendedDifficulty: DifficultyRecommendation;
  recommendedNextStep: string;
  strongAreas: string[];
  weakAreas: string[];
};

export type PersonalizationPage =
  | { status: "unauthenticated" }
  | { status: "incomplete" }
  | { status: "unavailable" }
  | { status: "no-roadmap" }
  | { status: "no-plan" }
  | { status: "insufficient"; profile: PersonalizationProfile }
  | {
      status: "ready";
      profile: PersonalizationProfile;
      planTitle: string;
      roadmapTitle: string;
      stageTitle: string | null;
      result: PersonalizationResult;
    };

export type PersonalizationMutation =
  | { ok: true; added: number }
  | { ok: false; reason: "missing" | "invalid" | "failed" | "already" };
