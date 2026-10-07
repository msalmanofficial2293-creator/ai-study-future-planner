export type StudyTaskStatus = "pending" | "completed";

export type StudyMilestoneOption = {
  id: string;
  title: string;
};

export type StudyTaskView = {
  id: string;
  title: string;
  description: string;
  skill: string;
  scheduledOn: string;
  durationMinutes: number;
  status: StudyTaskStatus;
  milestoneId: string;
  milestoneTitle: string;
};

export type StudyPlanDashboard = {
  roadmapTitle: string;
  roadmapTimeline: string;
  stageTitle: string;
  stageMilestone: string;
  stageSkills: string[];
  weeklyTarget: string;
  plannedMinutes: number;
  weekCompleted: number;
  weekTotal: number;
  subjects: string[];
  today: string;
  suggestedSkill: string;
  milestones: StudyMilestoneOption[];
  tasks: StudyTaskView[];
};

export type StudyPlanLoad =
  | { status: "unauthenticated" }
  | { status: "incomplete" }
  | { status: "unavailable" }
  | { status: "no-roadmap" }
  | { status: "ready"; plan: StudyPlanDashboard };

export type StudyTaskInput = {
  title: string;
  description: string;
  skill: string;
  scheduledOn: string;
  durationMinutes: number;
  milestoneId: string;
};
