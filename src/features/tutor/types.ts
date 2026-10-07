export type TutorRole = "user" | "assistant";

export type TutorMessage = {
  id: string;
  role: TutorRole;
  content: string;
  createdAt: string;
};

export type TutorConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type TutorSkillScore = {
  skill: string;
  correct: number;
  total: number;
  percent: number;
};

export type TutorMiss = {
  prompt: string;
  explanation: string | null;
  skill: string;
};

export type TutorTaskBrief = {
  title: string;
  skill: string;
  scheduledOn: string;
};

export type TutorLearningStyle = "reading" | "practice" | "video" | "mixed";

export type TutorSkillLevel = "beginner" | "intermediate" | "advanced";

export type TutorContext = {
  educationLabel: string | null;
  field: string | null;
  skillLevel: TutorSkillLevel | null;
  skillLabel: string | null;
  learningStyle: TutorLearningStyle | null;
  learningLabel: string | null;
  goalTitle: string | null;
  roadmapTitle: string | null;
  stageTitle: string | null;
  stageSkills: string[];
  planTitle: string | null;
  todayTasks: TutorTaskBrief[];
  upcomingTasks: TutorTaskBrief[];
  scores: TutorSkillScore[];
  misses: TutorMiss[];
  latestQuiz: { title: string; skill: string; percent: number } | null;
  adaptiveNote: string | null;
  performanceNote: string | null;
};

export type TutorFocus = {
  goalTitle: string | null;
  stageTitle: string | null;
  studyFocus: string | null;
};

export type TutorPageData = {
  focus: TutorFocus;
  conversations: TutorConversationSummary[];
  active: {
    id: string;
    title: string;
    messages: TutorMessage[];
  } | null;
  missingChat: boolean;
};

export type TutorPage =
  | { status: "unauthenticated" }
  | { status: "incomplete" }
  | { status: "unavailable" }
  | ({ status: "ready" } & TutorPageData);

export type TutorSendResult =
  | { ok: true; conversationId: string }
  | { ok: false; message: string };

export type TutorMutation = { ok: true } | { ok: false; reason: "missing" | "invalid" | "failed" };
