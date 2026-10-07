export const QUIZ_DIFFICULTIES = ["Foundation", "Practice", "Challenge"] as const;

export type QuizDifficulty = (typeof QUIZ_DIFFICULTIES)[number];

export type MockQuizQuestion = {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

export type MockQuiz = {
  title: string;
  skill: string;
  difficulty: QuizDifficulty;
  questions: MockQuizQuestion[];
};

export type MockQuizInput = {
  skill: string;
  field: string;
  goal: string;
  difficulty: QuizDifficulty;
};

export type QuizSummary = {
  id: string;
  title: string;
  skill: string;
  difficulty: QuizDifficulty;
  questionCount: number;
  continueAttemptId: string | null;
};

export type QuizHistoryItem = {
  attemptId: string;
  quizTitle: string;
  skill: string;
  percentage: number;
  submittedAt: string;
};

export type QuizDashboard = {
  roadmapTitle: string;
  quizzes: QuizSummary[];
  history: QuizHistoryItem[];
  canPrepare: boolean;
};

export type QuizPlayQuestion = {
  id: string;
  position: number;
  prompt: string;
  choices: string[];
};

export type QuizPlay = {
  attemptId: string;
  title: string;
  skill: string;
  difficulty: QuizDifficulty;
  questions: QuizPlayQuestion[];
};

export type QuizReviewItem = {
  position: number;
  prompt: string;
  choices: string[];
  selectedIndex: number;
  correctIndex: number;
  correct: boolean;
  explanation: string;
};

export type QuizResult = {
  attemptId: string;
  title: string;
  skill: string;
  difficulty: QuizDifficulty;
  correctCount: number;
  incorrectCount: number;
  total: number;
  percentage: number;
  review: QuizReviewItem[];
};

export type QuizPageData =
  | { status: "unauthenticated" }
  | { status: "incomplete" }
  | { status: "unavailable" }
  | { status: "no-roadmap" }
  | { status: "no-plan" }
  | { status: "missing-attempt" }
  | { status: "ready"; dashboard: QuizDashboard }
  | { status: "playing"; quiz: QuizPlay }
  | { status: "result"; result: QuizResult };
