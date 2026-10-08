import "server-only";

import { logServerDiagnostic } from "@/lib/security/log";
import { decodeQuizTitle } from "@/features/quiz/record";
import type {
  ActivityItem,
  PerformanceDashboard,
  PerformanceLoad,
  PerformanceSnapshot,
  RecentQuiz,
  SkillArea,
  TaskBar,
} from "@/features/performance/types";
import { currentStage, todayIso } from "@/features/study-plan/schedule";
import type { StudyTaskStatus } from "@/features/study-plan/types";
import { profileIsComplete } from "@/services/onboarding-status";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

const TREND_LIMIT = 8;
const LIST_LIMIT = 5;
const AREA_LIMIT = 3;
const STRONG_PERCENT = 80;

type StoredTask = {
  id: string;
  planId: string;
  milestoneId: string;
  title: string;
  status: "pending" | "completed" | "skipped";
  completedAt: string;
};

type StoredAttempt = {
  id: string;
  quizId: string;
  score: number;
  submittedAt: string;
};

type StoredAnswer = {
  attemptId: string;
  questionId: string;
  correct: boolean;
};

export async function loadPerformancePage(): Promise<PerformanceLoad> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const profileResult = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    logPerformanceDiagnostic("load-profile", profileResult.error);
    return { status: "unavailable" };
  }

  if (!profileIsComplete(profileResult.data)) {
    return { status: "incomplete" };
  }

  const [plans, tasks, milestones, roadmaps, quizzes, attempts, questions, answers, records] = await Promise.all([
    supabase.from("study_plans").select("id, roadmap_id, title, is_current").eq("user_id", user.id),
    supabase
      .from("study_tasks")
      .select("id, study_plan_id, milestone_id, title, details, status, completed_at")
      .eq("user_id", user.id),
    supabase.from("roadmap_milestones").select("id, roadmap_id, position, title").eq("user_id", user.id),
    supabase.from("roadmaps").select("id, title, is_current, created_at").eq("user_id", user.id),
    supabase.from("quizzes").select("id, title").eq("user_id", user.id),
    supabase
      .from("quiz_attempts")
      .select("id, quiz_id, status, score, submitted_at")
      .eq("user_id", user.id)
      .eq("status", "submitted"),
    supabase.from("quiz_questions").select("id, quiz_id").eq("user_id", user.id),
    supabase.from("quiz_answers").select("attempt_id, question_id, is_correct").eq("user_id", user.id),
    supabase
      .from("performance_records")
      .select("id, recorded_on, tasks_completed, tasks_total, quizzes_taken, average_score, summary, consistency_note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),
  ]);

  const failed = [plans, tasks, milestones, roadmaps, quizzes, attempts, questions, answers, records].find((result) => result.error);

  if (failed?.error) {
    logPerformanceDiagnostic("load-performance", failed.error);
    return { status: "unavailable" };
  }

  const planRows = (plans.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const id = readString(record, "id");
    const roadmapId = readString(record, "roadmap_id");
    const title = readString(record, "title");

    if (!id || !roadmapId || !title) {
      return [];
    }

    return [{ id, roadmapId, title, current: record?.is_current === true }];
  });
  const roadmapRows = (roadmaps.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const id = readString(record, "id");
    const title = readString(record, "title");

    if (!id || !title) {
      return [];
    }

    return [{
      id,
      title,
      current: record?.is_current === true,
      createdAt: readString(record, "created_at"),
    }];
  });
  const milestoneRows = (milestones.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const id = readString(record, "id");
    const roadmapId = readString(record, "roadmap_id");
    const title = readString(record, "title");
    const position = readInteger(record, "position");

    if (!id || !roadmapId || !title || position === null) {
      return [];
    }

    return [{ id, roadmapId, title, position }];
  });
  const taskRows = (tasks.data ?? []).flatMap((row) => readTask(row));
  const quizTitles = new Map<string, { title: string; skill: string }>();

  for (const row of quizzes.data ?? []) {
    const record = asRecord(row);
    const id = readString(record, "id");

    if (!id) {
      continue;
    }

    const stored = decodeQuizTitle(readString(record, "title"));
    quizTitles.set(id, { title: stored.title, skill: stored.skill });
  }

  const questionQuiz = new Map<string, string>();

  for (const row of questions.data ?? []) {
    const record = asRecord(row);
    const id = readString(record, "id");
    const quizId = readString(record, "quiz_id");

    if (id && quizId) {
      questionQuiz.set(id, quizId);
    }
  }

  const attemptRows = (attempts.data ?? []).flatMap((row) => readAttempt(row));
  const answerRows = (answers.data ?? []).flatMap((row) => readAnswer(row));
  const submittedIds = new Set(attemptRows.map((attempt) => attempt.id));
  const snapshots = (records.data ?? []).flatMap((row) => readSnapshot(row));

  // Empty only when there is no study activity at all (no tasks and no quizzes).
  // Pending tasks alone still produce a ready dashboard with 0% completion.
  if (taskRows.length === 0 && attemptRows.length === 0) {
    return {
      status: "empty",
      hasRoadmap: roadmapRows.length > 0,
      hasPlan: planRows.length > 0,
    };
  }

  return {
    status: "ready",
    dashboard: buildDashboard({
      plans: planRows,
      roadmaps: roadmapRows,
      milestones: milestoneRows,
      tasks: taskRows,
      attempts: attemptRows,
      answers: answerRows.filter((answer) => submittedIds.has(answer.attemptId)),
      questionQuiz,
      quizTitles,
      snapshots,
    }),
  };
}

export async function recordTaskPerformance(
  userId: string,
  planId: string,
  event: "completed" | "reopened",
  taskTitle: string,
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const planResult = await supabase
      .from("study_plans")
      .select("roadmap_id")
      .eq("user_id", userId)
      .eq("id", planId)
      .maybeSingle();

    if (planResult.error) {
      logPerformanceDiagnostic("task-plan", planResult.error);
      return;
    }

    const roadmapId = readString(asRecord(planResult.data), "roadmap_id");

    if (!roadmapId) {
      return;
    }

    const roadmapResult = await supabase
      .from("roadmaps")
      .select("goal_id")
      .eq("user_id", userId)
      .eq("id", roadmapId)
      .maybeSingle();

    if (roadmapResult.error) {
      logPerformanceDiagnostic("task-roadmap", roadmapResult.error);
      return;
    }

    const goalId = readString(asRecord(roadmapResult.data), "goal_id");

    if (!goalId) {
      return;
    }

    const taskResult = await supabase
      .from("study_tasks")
      .select("status")
      .eq("user_id", userId)
      .eq("study_plan_id", planId);

    if (taskResult.error) {
      logPerformanceDiagnostic("task-counts", taskResult.error);
      return;
    }

    const statuses = (taskResult.data ?? []).flatMap((row) => {
      const status = readString(asRecord(row), "status");
      return isTaskStatus(status) ? [status] : [];
    });
    const tasksTotal = statuses.length;
    const tasksCompleted = statuses.filter((status) => status === "completed").length;
    const scoreResult = await supabase
      .from("quiz_attempts")
      .select("score")
      .eq("user_id", userId)
      .eq("status", "submitted");

    if (scoreResult.error) {
      logPerformanceDiagnostic("task-scores", scoreResult.error);
      return;
    }

    const scores = (scoreResult.data ?? []).flatMap((row) => {
      const score = readScore(asRecord(row)?.score);
      return score === null ? [] : [score];
    });
    const average = averageScore(scores);
    const taskPercent = percent(tasksCompleted, tasksTotal) ?? 0;
    const title = clip(taskTitle.trim() || "Study task", 120);
    const saved = await supabase.from("performance_records").insert({
      user_id: userId,
      goal_id: goalId,
      study_plan_id: planId,
      recorded_on: todayIso(),
      tasks_completed: tasksCompleted,
      tasks_total: tasksTotal,
      quizzes_taken: scores.length,
      average_score: average,
      summary: event === "completed" ? `Marked "${title}" complete.` : `Marked "${title}" incomplete.`,
      consistency_note: taskConsistency(taskPercent),
    });

    if (saved.error) {
      logPerformanceDiagnostic("insert-task-performance", saved.error);
    }
  } catch {
    logPerformanceDiagnostic("task-snapshot", null);
  }
}

function buildDashboard(input: {
  plans: Array<{ id: string; roadmapId: string; title: string; current: boolean }>;
  roadmaps: Array<{ id: string; title: string; current: boolean; createdAt: string }>;
  milestones: Array<{ id: string; roadmapId: string; title: string; position: number }>;
  tasks: StoredTask[];
  attempts: StoredAttempt[];
  answers: StoredAnswer[];
  questionQuiz: Map<string, string>;
  quizTitles: Map<string, { title: string; skill: string }>;
  snapshots: PerformanceSnapshot[];
}): PerformanceDashboard {
  const tasksCompleted = input.tasks.filter((task) => task.status === "completed").length;
  const tasksTotal = input.tasks.length;
  const taskPercent = percent(tasksCompleted, tasksTotal);
  const quizAverage = averageScore(input.attempts.map((attempt) => attempt.score));
  const overall = overallPercent(taskPercent, quizAverage) ?? 0;
  const currentRoadmap = [...input.roadmaps]
    .filter((roadmap) => roadmap.current)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null;
  const currentPlan = currentRoadmap
    ? input.plans.find((plan) => plan.current && plan.roadmapId === currentRoadmap.id) ?? null
    : null;
  const currentTasks = currentPlan ? input.tasks.filter((task) => task.planId === currentPlan.id) : [];
  const currentCompleted = currentTasks.filter((task) => task.status === "completed").length;
  const stageMilestones = currentRoadmap
    ? input.milestones
      .filter((milestone) => milestone.roadmapId === currentRoadmap.id)
      .sort((left, right) => left.position - right.position)
    : [];
  const stage = currentStage(
    stageMilestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      position: milestone.position,
    })),
    currentTasks.flatMap((task) => {
      if (!task.milestoneId || !isStudyStatus(task.status)) {
        return [];
      }

      return [{ milestoneId: task.milestoneId, status: task.status }];
    }),
  );
  const milestoneTitle = new Map(input.milestones.map((milestone) => [milestone.id, milestone.title]));
  const areas = skillAreas(input.attempts, input.answers, input.questionQuiz, input.quizTitles);
  const recentQuizzes = recentQuizResults(input.attempts, input.answers, input.quizTitles);
  const quizTrend = [...recentQuizzes].reverse().slice(-TREND_LIMIT).map((quiz) => ({
    id: quiz.id,
    label: quiz.submittedAt,
    title: quiz.title,
    skill: quiz.skill,
    score: quiz.score,
  }));

  return {
    overallPercent: overall,
    averageQuizScore: quizAverage,
    quizzesCompleted: input.attempts.length,
    tasksCompleted,
    tasksTotal,
    taskPercent,
    currentPlanTitle: currentPlan?.title ?? null,
    currentRoadmapTitle: currentRoadmap?.title ?? null,
    currentStageTitle: stage?.title ?? null,
    currentCompleted,
    currentTotal: currentTasks.length,
    currentPercent: percent(currentCompleted, currentTasks.length),
    summary: progressSummary({
      tasksCompleted,
      tasksTotal,
      taskPercent,
      quizzesCompleted: input.attempts.length,
      quizAverage,
      stageTitle: stage?.title ?? null,
      note: input.snapshots[0]?.consistencyNote ?? "",
    }),
    quizTrend,
    taskBars: taskBars(input.tasks, milestoneTitle),
    strongAreas: areas.filter((area) => area.percent >= STRONG_PERCENT).slice(0, AREA_LIMIT),
    weakAreas: areas
      .filter((area) => area.percent < STRONG_PERCENT)
      .sort((left, right) => left.percent - right.percent || right.total - left.total)
      .slice(0, AREA_LIMIT),
    recentQuizzes: recentQuizzes.slice(0, LIST_LIMIT),
    recentActivity: recentActivity(input.tasks, recentQuizzes, milestoneTitle).slice(0, LIST_LIMIT),
    snapshots: input.snapshots,
  };
}

function skillAreas(
  attempts: StoredAttempt[],
  answers: StoredAnswer[],
  questionQuiz: Map<string, string>,
  quizTitles: Map<string, { title: string; skill: string }>,
): SkillArea[] {
  const attemptQuiz = new Map(attempts.map((attempt) => [attempt.id, attempt.quizId]));
  const totals = new Map<string, { correct: number; total: number }>();

  for (const answer of answers) {
    const quizId = attemptQuiz.get(answer.attemptId) ?? questionQuiz.get(answer.questionId);
    const skill = quizId ? quizTitles.get(quizId)?.skill : undefined;

    if (!skill) {
      continue;
    }

    const current = totals.get(skill) ?? { correct: 0, total: 0 };
    current.total += 1;
    current.correct += answer.correct ? 1 : 0;
    totals.set(skill, current);
  }

  return [...totals.entries()]
    .flatMap(([skill, counts]) => {
      const value = percent(counts.correct, counts.total);
      return value === null ? [] : [{ skill, correct: counts.correct, total: counts.total, percent: value }];
    })
    .sort((left, right) => right.percent - left.percent || right.total - left.total);
}

function recentQuizResults(
  attempts: StoredAttempt[],
  answers: StoredAnswer[],
  quizTitles: Map<string, { title: string; skill: string }>,
): RecentQuiz[] {
  const byAttempt = new Map<string, { correct: number; total: number }>();

  for (const answer of answers) {
    const current = byAttempt.get(answer.attemptId) ?? { correct: 0, total: 0 };
    current.total += 1;
    current.correct += answer.correct ? 1 : 0;
    byAttempt.set(answer.attemptId, current);
  }

  return [...attempts]
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
    .map((attempt) => {
      const stored = quizTitles.get(attempt.quizId);
      const counts = byAttempt.get(attempt.id) ?? { correct: 0, total: 0 };
      return {
        id: attempt.id,
        title: stored?.title || "Practice quiz",
        skill: stored?.skill || "General",
        score: attempt.score,
        correct: counts.correct,
        total: counts.total,
        submittedAt: attempt.submittedAt,
      };
    });
}

function taskBars(tasks: StoredTask[], milestoneTitle: Map<string, string>): TaskBar[] {
  const groups = new Map<string, TaskBar>();

  for (const task of tasks) {
    const id = task.milestoneId || "unassigned";
    const current = groups.get(id) ?? {
      id,
      label: milestoneTitle.get(task.milestoneId) || "Tasks without a milestone",
      completed: 0,
      total: 0,
    };
    current.total += 1;
    current.completed += task.status === "completed" ? 1 : 0;
    groups.set(id, current);
  }

  return [...groups.values()].sort((left, right) => left.label.localeCompare(right.label));
}

function recentActivity(
  tasks: StoredTask[],
  quizzes: RecentQuiz[],
  milestoneTitle: Map<string, string>,
): ActivityItem[] {
  const taskItems: ActivityItem[] = tasks.flatMap((task) => {
    if (task.status !== "completed" || !task.completedAt) {
      return [];
    }

    const milestone = milestoneTitle.get(task.milestoneId);
    return [{
      id: `task-${task.id}`,
      kind: "task" as const,
      title: task.title,
      detail: milestone ? `Task completed · ${milestone}` : "Task completed",
      at: task.completedAt,
    }];
  });
  const quizItems: ActivityItem[] = quizzes.map((quiz) => ({
    id: `quiz-${quiz.id}`,
    kind: "quiz" as const,
    title: quiz.title,
    detail: `Quiz submitted · ${formatStoredPercent(quiz.score)} · ${quiz.skill}`,
    at: quiz.submittedAt,
  }));

  return [...taskItems, ...quizItems].sort((left, right) => right.at.localeCompare(left.at));
}

function progressSummary(input: {
  tasksCompleted: number;
  tasksTotal: number;
  taskPercent: number | null;
  quizzesCompleted: number;
  quizAverage: number | null;
  stageTitle: string | null;
  note: string;
}): string {
  const taskSentence = input.tasksTotal === 0
    ? "No study tasks are saved yet."
    : `${input.tasksCompleted} of ${input.tasksTotal} study ${input.tasksTotal === 1 ? "task is" : "tasks are"} complete${input.taskPercent === null ? "" : ` (${input.taskPercent}%)`}.`;
  const quizSentence = input.quizzesCompleted === 0 || input.quizAverage === null
    ? "No quiz has been submitted yet."
    : `${input.quizzesCompleted} ${input.quizzesCompleted === 1 ? "quiz is" : "quizzes are"} submitted, with an average score of ${formatStoredPercent(input.quizAverage)}.`;
  const stageSentence = input.stageTitle ? ` Current stage: ${input.stageTitle}.` : "";
  const noteSentence = input.note ? ` Latest note: ${input.note}` : "";
  return `${taskSentence} ${quizSentence}${stageSentence}${noteSentence}`;
}

function overallPercent(taskPercent: number | null, quizAverage: number | null): number | null {
  if (taskPercent !== null && quizAverage !== null) {
    return Math.round((taskPercent + quizAverage) / 2);
  }

  if (taskPercent !== null) {
    return taskPercent;
  }

  if (quizAverage !== null) {
    return Math.round(quizAverage);
  }

  return null;
}

function percent(part: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }

  return Math.round((part / total) * 100);
}

function averageScore(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
}

function taskConsistency(taskPercent: number): string {
  if (taskPercent >= 80) {
    return "Most saved tasks are complete.";
  }

  if (taskPercent >= 50) {
    return "At least half of the saved tasks are complete.";
  }

  return "Most saved tasks are still open.";
}

function readTask(value: unknown): StoredTask[] {
  const record = asRecord(value);
  const id = readString(record, "id");
  const planId = readString(record, "study_plan_id");
  const title = readString(record, "title");
  const status = readString(record, "status");

  if (!id || !planId || !title || !isTaskStatus(status)) {
    return [];
  }

  return [{
    id,
    planId,
    milestoneId: readString(record, "milestone_id"),
    title,
    status,
    completedAt: readString(record, "completed_at"),
  }];
}

function readAttempt(value: unknown): StoredAttempt[] {
  const record = asRecord(value);
  const id = readString(record, "id");
  const quizId = readString(record, "quiz_id");
  const score = readScore(record?.score);
  const submittedAt = readString(record, "submitted_at");

  if (!id || !quizId || score === null || !submittedAt) {
    return [];
  }

  return [{ id, quizId, score, submittedAt }];
}

function readAnswer(value: unknown): StoredAnswer[] {
  const record = asRecord(value);
  const attemptId = readString(record, "attempt_id");
  const questionId = readString(record, "question_id");

  if (!attemptId || !questionId || typeof record?.is_correct !== "boolean") {
    return [];
  }

  return [{ attemptId, questionId, correct: record.is_correct }];
}

function readSnapshot(value: unknown): PerformanceSnapshot[] {
  const record = asRecord(value);
  const id = readString(record, "id");
  const recordedOn = readString(record, "recorded_on");
  const tasksCompleted = readInteger(record, "tasks_completed");
  const tasksTotal = readInteger(record, "tasks_total");
  const quizzesTaken = readInteger(record, "quizzes_taken");

  if (!id || !recordedOn || tasksCompleted === null || tasksTotal === null || quizzesTaken === null) {
    return [];
  }

  return [{
    id,
    recordedOn,
    summary: readString(record, "summary") || "Saved snapshot",
    tasksCompleted,
    tasksTotal,
    quizzesTaken,
    averageScore: readScore(record?.average_score),
    consistencyNote: readString(record, "consistency_note"),
  }];
}

function isTaskStatus(value: string): value is StoredTask["status"] {
  return value === "pending" || value === "completed" || value === "skipped";
}

function isStudyStatus(value: StoredTask["status"]): value is StudyTaskStatus {
  return value === "pending" || value === "completed";
}

function formatStoredPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function clip(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }

  return value.slice(0, max - 1).trimEnd();
}

function readScore(value: unknown): number | null {
  const score = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return null;
  }

  return score;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown> | null, key: string): string {
  const value = record?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function readInteger(record: Record<string, unknown> | null, key: string): number | null {
  const value = record?.[key];
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function logPerformanceDiagnostic(step: string, error: { message: string; code?: string } | null): void {
  logServerDiagnostic("performance", step, error);
}
