import "server-only";

import { logServerDiagnostic } from "@/lib/security/log";
import { buildRecommendation } from "@/features/adaptive-plan/rules";
import type { AdaptiveLoad, AdaptiveMutation, SavedAdaptivePlan } from "@/features/adaptive-plan/types";
import { decodeQuizTitle } from "@/features/quiz/record";
import { decodeMilestoneDescription } from "@/features/roadmap/record";
import { decodeTaskDetails } from "@/features/study-plan/record";
import { currentStage, todayIso } from "@/features/study-plan/schedule";
import type { StudyTaskStatus } from "@/features/study-plan/types";
import { profileIsComplete } from "@/services/onboarding-status";
import { createStudyTask } from "@/services/study-plan";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

type PlanContext = {
  planId: string;
  planTitle: string;
  roadmapTitle: string;
  recommendation: ReturnType<typeof buildRecommendation>;
  performanceRecordId: string | null;
};

export async function loadAdaptivePlan(): Promise<AdaptiveLoad> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const context = await loadContext(user.id);

  if (!context.ok) {
    return { status: context.reason };
  }

  return {
    status: "ready",
    planTitle: context.planTitle,
    roadmapTitle: context.roadmapTitle,
    recommendation: context.recommendation,
    saved: context.saved,
  };
}

export async function saveAdaptiveRecommendation(userId: string): Promise<AdaptiveMutation> {
  const context = await loadContext(userId);

  if (!context.ok) {
    return mutationFailure(context.reason);
  }

  const saved = await writeAdaptivePlan(userId, context, "draft");
  return saved ? { ok: true, added: 0 } : { ok: false, reason: "failed" };
}

export async function applyAdaptiveRecommendation(userId: string): Promise<AdaptiveMutation> {
  const context = await loadContext(userId);

  if (!context.ok) {
    return mutationFailure(context.reason);
  }

  let added = 0;

  for (const task of context.recommendation.tasks) {
    if (task.alreadyOnPlan) {
      continue;
    }

    const created = await createStudyTask(userId, {
      title: task.title,
      description: task.description,
      skill: task.skill,
      scheduledOn: task.scheduledOn,
      durationMinutes: task.durationMinutes,
      milestoneId: task.milestoneId,
    });

    if (!created.ok) {
      return { ok: false, reason: "failed" };
    }

    added += 1;
  }

  const saved = await writeAdaptivePlan(userId, context, "applied");
  return saved ? { ok: true, added } : { ok: false, reason: "failed" };
}

async function loadContext(userId: string): Promise<
  | ({ ok: true; saved: SavedAdaptivePlan | null } & PlanContext)
  | { ok: false; reason: "incomplete" | "unavailable" | "no-roadmap" | "no-plan" | "insufficient" }
> {
  const user = await getAuthenticatedUser();

  if (!user || user.id !== userId) {
    return { ok: false, reason: "unavailable" };
  }

  const supabase = await createSupabaseServerClient();
  const profileResult = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileResult.error) {
    logAdaptiveDiagnostic("load-profile", profileResult.error);
    return { ok: false, reason: "unavailable" };
  }

  if (!profileIsComplete(profileResult.data)) {
    return { ok: false, reason: "incomplete" };
  }

  const roadmapResult = await supabase
    .from("roadmaps")
    .select("id, title, created_at")
    .eq("user_id", userId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roadmapResult.error) {
    logAdaptiveDiagnostic("load-roadmap", roadmapResult.error);
    return { ok: false, reason: "unavailable" };
  }

  const roadmap = asRecord(roadmapResult.data);
  const roadmapId = readString(roadmap, "id");
  const roadmapTitle = readString(roadmap, "title");

  if (!roadmapId || !roadmapTitle) {
    return { ok: false, reason: "no-roadmap" };
  }

  const [planResult, milestoneResult, taskResult, quizResult, attemptResult, questionResult, answerResult, recordResult, adaptiveResult] = await Promise.all([
    supabase
      .from("study_plans")
      .select("id, title")
      .eq("user_id", userId)
      .eq("roadmap_id", roadmapId)
      .eq("is_current", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("roadmap_milestones")
      .select("id, position, title, description")
      .eq("user_id", userId)
      .eq("roadmap_id", roadmapId)
      .order("position", { ascending: true }),
    supabase
      .from("study_tasks")
      .select("study_plan_id, title, details, status, milestone_id")
      .eq("user_id", userId),
    supabase.from("quizzes").select("id, title, study_plan_id").eq("user_id", userId),
    supabase
      .from("quiz_attempts")
      .select("id, quiz_id, score, status")
      .eq("user_id", userId)
      .eq("status", "submitted"),
    supabase.from("quiz_questions").select("id, quiz_id").eq("user_id", userId),
    supabase.from("quiz_answers").select("attempt_id, question_id, is_correct").eq("user_id", userId),
    supabase
      .from("performance_records")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("adaptive_plans")
      .select("id, status, created_at, study_plan_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const failed = [planResult, milestoneResult, taskResult, quizResult, attemptResult, questionResult, answerResult, recordResult, adaptiveResult]
    .find((result) => result.error);

  if (failed?.error) {
    logAdaptiveDiagnostic("load-adaptive", failed.error);
    return { ok: false, reason: "unavailable" };
  }

  const plan = asRecord(planResult.data);
  const planId = readString(plan, "id");
  const planTitle = readString(plan, "title");

  if (!planId || !planTitle) {
    return { ok: false, reason: "no-plan" };
  }

  const milestones = (milestoneResult.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const id = readString(record, "id");
    const title = readString(record, "title");
    const position = readInteger(record, "position");

    if (!id || !title || position === null) {
      return [];
    }

    return [{
      id,
      title,
      position,
      skills: decodeMilestoneDescription(readString(record, "description")).skills,
    }];
  });
  const tasks = (taskResult.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const title = readString(record, "title");
    const status = readString(record, "status");
    const studyPlanId = readString(record, "study_plan_id");

    if (!title || !isTaskStatus(status) || studyPlanId !== planId) {
      return [];
    }

    return [{
      title,
      skill: decodeTaskDetails(readString(record, "details")).skill,
      status,
      milestoneId: readString(record, "milestone_id"),
    }];
  });
  const quizTitles = new Map<string, string>();

  for (const row of quizResult.data ?? []) {
    const record = asRecord(row);
    const id = readString(record, "id");

    if (id) {
      quizTitles.set(id, decodeQuizTitle(readString(record, "title")).skill);
    }
  }

  const questionQuiz = new Map<string, string>();

  for (const row of questionResult.data ?? []) {
    const record = asRecord(row);
    const id = readString(record, "id");
    const quizId = readString(record, "quiz_id");

    if (id && quizId) {
      questionQuiz.set(id, quizId);
    }
  }

  const attempts = (attemptResult.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const id = readString(record, "id");
    const quizId = readString(record, "quiz_id");
    const score = readScore(record?.score);

    if (!id || !quizId || score === null) {
      return [];
    }

    return [{ id, quizId, score }];
  });
  const submitted = new Set(attempts.map((attempt) => attempt.id));
  const attemptQuiz = new Map(attempts.map((attempt) => [attempt.id, attempt.quizId]));
  const totals = new Map<string, { correct: number; total: number }>();

  for (const row of answerResult.data ?? []) {
    const record = asRecord(row);
    const attemptId = readString(record, "attempt_id");
    const questionId = readString(record, "question_id");

    if (!attemptId || !submitted.has(attemptId) || typeof record?.is_correct !== "boolean") {
      continue;
    }

    const quizId = attemptQuiz.get(attemptId) ?? questionQuiz.get(questionId);
    const skill = quizId ? quizTitles.get(quizId) : undefined;

    if (!skill) {
      continue;
    }

    const current = totals.get(skill) ?? { correct: 0, total: 0 };
    current.total += 1;
    current.correct += record.is_correct ? 1 : 0;
    totals.set(skill, current);
  }

  if (totals.size === 0) {
    return { ok: false, reason: "insufficient" };
  }

  const stage = currentStage(
    milestones.map((milestone) => ({ id: milestone.id, title: milestone.title, position: milestone.position })),
    tasks.flatMap((task) => {
      if (!task.milestoneId || !isStudyStatus(task.status)) {
        return [];
      }

      return [{ milestoneId: task.milestoneId, status: task.status }];
    }),
  );
  const counted = tasks.filter((task) => isStudyStatus(task.status));
  const recommendation = buildRecommendation({
    today: todayIso(),
    planTitle,
    stageTitle: stage?.title ?? "",
    tasksCompleted: counted.filter((task) => task.status === "completed").length,
    tasksTotal: counted.length,
    quizAverage: averageScore(attempts.map((attempt) => attempt.score)),
    quizzesCompleted: attempts.length,
    milestones,
    tasks,
    skills: [...totals.entries()].map(([skill, counts]) => ({ skill, ...counts })),
  });

  if (recommendation.changes.length === 0) {
    return { ok: false, reason: "insufficient" };
  }

  return {
    ok: true,
    planId,
    planTitle,
    roadmapTitle,
    recommendation,
    performanceRecordId: readString(asRecord(recordResult.data), "id") || null,
    saved: readSaved(adaptiveResult.data, planId),
  };
}

async function writeAdaptivePlan(
  userId: string,
  context: PlanContext,
  status: "draft" | "applied",
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const existing = await supabase
    .from("adaptive_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("study_plan_id", context.planId)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    logAdaptiveDiagnostic("load-draft", existing.error);
    return false;
  }

  const draftId = readString(asRecord(existing.data), "id");
  const payload = {
    rationale: context.recommendation.rationale,
    status,
    performance_record_id: context.performanceRecordId,
  };

  if (draftId) {
    const updated = await supabase
      .from("adaptive_plans")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", draftId)
      .select("id");

    if (updated.error || !updated.data || updated.data.length === 0) {
      logAdaptiveDiagnostic("update-adaptive", updated.error);
      return false;
    }

    return true;
  }

  const inserted = await supabase.from("adaptive_plans").insert({
    user_id: userId,
    study_plan_id: context.planId,
    ...payload,
  }).select("id");

  if (inserted.error || !inserted.data || inserted.data.length === 0) {
    logAdaptiveDiagnostic("insert-adaptive", inserted.error);
    return false;
  }

  return true;
}

function readSaved(value: unknown, planId: string): SavedAdaptivePlan | null {
  const record = asRecord(value);
  const id = readString(record, "id");
  const status = readString(record, "status");
  const createdAt = readString(record, "created_at");

  if (!id || !createdAt || readString(record, "study_plan_id") !== planId || !isAdaptiveStatus(status)) {
    return null;
  }

  return { id, status, createdAt };
}

function mutationFailure(reason: "incomplete" | "unavailable" | "no-roadmap" | "no-plan" | "insufficient"): AdaptiveMutation {
  if (reason === "no-plan" || reason === "no-roadmap") {
    return { ok: false, reason: "missing-plan" };
  }

  if (reason === "insufficient") {
    return { ok: false, reason: "insufficient" };
  }

  return { ok: false, reason: "failed" };
}

function isAdaptiveStatus(value: string): value is SavedAdaptivePlan["status"] {
  return value === "draft" || value === "applied" || value === "discarded";
}

function isTaskStatus(value: string): value is "pending" | "completed" | "skipped" {
  return value === "pending" || value === "completed" || value === "skipped";
}

function isStudyStatus(value: string): value is StudyTaskStatus {
  return value === "pending" || value === "completed";
}

function averageScore(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
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

function logAdaptiveDiagnostic(step: string, error: { message: string; code?: string } | null): void {
  logServerDiagnostic("adaptive", step, error);
}
