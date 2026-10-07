export type SkillArea = {
  skill: string;
  correct: number;
  total: number;
  percent: number;
};

export type QuizTrendPoint = {
  id: string;
  label: string;
  title: string;
  skill: string;
  score: number;
};

export type TaskBar = {
  id: string;
  label: string;
  completed: number;
  total: number;
};

export type RecentQuiz = {
  id: string;
  title: string;
  skill: string;
  score: number;
  correct: number;
  total: number;
  submittedAt: string;
};

export type ActivityItem = {
  id: string;
  kind: "task" | "quiz";
  title: string;
  detail: string;
  at: string;
};

export type PerformanceSnapshot = {
  id: string;
  recordedOn: string;
  summary: string;
  tasksCompleted: number;
  tasksTotal: number;
  quizzesTaken: number;
  averageScore: number | null;
  consistencyNote: string;
};

export type PerformanceDashboard = {
  overallPercent: number;
  averageQuizScore: number | null;
  quizzesCompleted: number;
  tasksCompleted: number;
  tasksTotal: number;
  taskPercent: number | null;
  currentPlanTitle: string | null;
  currentRoadmapTitle: string | null;
  currentStageTitle: string | null;
  currentCompleted: number;
  currentTotal: number;
  currentPercent: number | null;
  summary: string;
  quizTrend: QuizTrendPoint[];
  taskBars: TaskBar[];
  strongAreas: SkillArea[];
  weakAreas: SkillArea[];
  recentQuizzes: RecentQuiz[];
  recentActivity: ActivityItem[];
  snapshots: PerformanceSnapshot[];
};

export type PerformanceLoad =
  | { status: "unauthenticated" }
  | { status: "incomplete" }
  | { status: "unavailable" }
  | { status: "empty"; hasRoadmap: boolean; hasPlan: boolean }
  | { status: "ready"; dashboard: PerformanceDashboard };
