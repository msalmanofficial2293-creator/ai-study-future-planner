export type RoadmapSkillLevel = "beginner" | "intermediate" | "advanced";

export type RoadmapWeeklyTime = "under_5" | "5_to_10" | "10_to_20" | "over_20";

export type RoadmapLearningStyle = "reading" | "practice" | "video" | "mixed";

export type RoadmapLearnerInput = {
  careerGoal: string;
  targetOutcome: string;
  educationLevel: string;
  fieldOfStudy: string;
  skillLevel: RoadmapSkillLevel;
  weeklyStudyTime: RoadmapWeeklyTime;
  learningStyle: RoadmapLearningStyle;
};

export type RoadmapStage = {
  title: string;
  skills: string[];
  milestone: string;
};

export type RoadmapDraft = {
  title: string;
  overview: string;
  timeline: string;
  stages: RoadmapStage[];
  nextSteps: string[];
};

export type SavedRoadmap = RoadmapDraft & {
  id: string;
};
