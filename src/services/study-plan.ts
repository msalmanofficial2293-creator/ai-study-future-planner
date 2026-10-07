import "server-only";

import { WEEKLY_STUDY_TIMES } from "@/features/onboarding/options";
import { decodeMilestoneDescription, decodeRoadmapSummary } from "@/features/roadmap/record";
import { decodeTaskDetails, encodeTaskDetails } from "@/features/study-plan/record";
import {
  currentStage,
  todayIso,
  weekRange,
} from "@/features/study-plan/schedule";
import type {
  StudyPlanDashboard,
  StudyPlanLoad,
  StudyTaskInput,
  StudyTaskStatus,
} from "@/features/study-plan/types";
import { profileIsComplete } from "@/services/onboarding-status";
import { recordTaskPerformance } from "@/services/performance";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

export type StudyPlanMutation =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "missing-roadmap" | "missing-task" | "invalid-milestone" | "failed" };

type PlanContext = {
  planId: string;
  milestones: Map<string, string>;
};

export async function loadStudyPlan(): Promise<StudyPlanLoad> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const profileResult = await supabase
    .from("profiles")
    .select("weekly_study_time, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    logStudyPlanDiagnostic("load-profile", profileResult.error);
    return { status: "unavailable" };
  }

  if (!profileIsComplete(profileResult.data)) {
    return { status: "incomplete" };
  }

  const roadmapResult = await supabase
    .from("roadmaps")
    .select("id, title, summary")
    .eq("user_id", user.id)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roadmapResult.error) {
    logStudyPlanDiagnostic("load-roadmap", roadmapResult.error);
    return { status: "unavailable" };
  }

  const roadmap = asRecord(roadmapResult.data);
  const roadmapId = readString(roadmap, "id");

  if (!roadmapId) {
    return { status: "no-roadmap" };
  }

  const milestoneResult = await supabase
    .from("roadmap_milestones")
    .select("id, position, title, description")
    .eq("user_id", user.id)
    .eq("roadmap_id", roadmapId)
    .order("position", { ascending: true });

  if (milestoneResult.error) {
    logStudyPlanDiagnostic("load-milestones", milestoneResult.error);
    return { status: "unavailable" };
  }

  const stages = (milestoneResult.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const id = readString(record, "id");
    const title = readString(record, "title");
    const position = readNumber(record, "position");

    if (!id || !title || position === null) {
      return [];
    }

    const decoded = decodeMilestoneDescription(readString(record, "description"));
    return [{ id, title, position, skills: decoded.skills, milestone: decoded.milestone }];
  });

  const planResult = await supabase
    .from("study_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("roadmap_id", roadmapId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planResult.error) {
    logStudyPlanDiagnostic("load-plan", planResult.error);
    return { status: "unavailable" };
  }

  const planId = readString(asRecord(planResult.data), "id");
  const taskRows = planId ? await loadTasks(user.id, planId) : { ok: true as const, tasks: [] };

  if (!taskRows.ok) {
    return { status: "unavailable" };
  }

  const milestoneTitles = new Map(stages.map((stage) => [stage.id, stage.title]));
  const tasks = taskRows.tasks.map((task) => ({
    ...task,
    milestoneTitle: task.milestoneId ? milestoneTitles.get(task.milestoneId) ?? "Milestone" : "Not linked",
  }));
  const stage = currentStage(stages, tasks.map((task) => ({
    milestoneId: task.milestoneId,
    status: task.status,
  })));
  const stageRecord = stages.find((item) => item.id === stage?.id) ?? null;
  const today = todayIso();
  const week = weekRange(today);
  const weekTasks = tasks.filter(
    (task) => task.scheduledOn >= week.start && task.scheduledOn <= week.end,
  );
  const plannedMinutes = weekTasks.reduce((total, task) => total + task.durationMinutes, 0);
  const subjects = uniqueSubjects([
    ...(stageRecord?.skills ?? []),
    ...tasks.map((task) => task.skill),
  ]);
  const weeklyCode = readString(asRecord(profileResult.data), "weekly_study_time");
  const summary = decodeRoadmapSummary(readString(roadmap, "summary"));

  const plan: StudyPlanDashboard = {
    roadmapTitle: readString(roadmap, "title") || "Your roadmap",
    roadmapTimeline: summary.timeline,
    stageTitle: stageRecord?.title ?? "No stage yet",
    stageMilestone: stageRecord?.milestone ?? "Generate a roadmap with stages before choosing a milestone.",
    stageSkills: stageRecord?.skills ?? [],
    weeklyTarget: WEEKLY_STUDY_TIMES.find((option) => option.value === weeklyCode)?.label ?? "Not set yet",
    plannedMinutes,
    weekCompleted: weekTasks.filter((task) => task.status === "completed").length,
    weekTotal: weekTasks.length,
    subjects,
    today,
    suggestedSkill: stageRecord?.skills[0] ?? "",
    milestones: stages.map((item) => ({ id: item.id, title: item.title })),
    tasks,
  };

  return { status: "ready", plan };
}

export async function createStudyTask(userId: string, input: StudyTaskInput): Promise<StudyPlanMutation> {
  const context = await ensureCurrentPlan(userId);

  if (!context.ok) {
    return context;
  }

  if (input.milestoneId && !context.milestones.has(input.milestoneId)) {
    return { ok: false, reason: "invalid-milestone" };
  }

  const supabase = await createSupabaseServerClient();
  const position = (await nextPosition(userId, context.planId)) + 1;
  const inserted = await supabase.from("study_tasks").insert({
    user_id: userId,
    study_plan_id: context.planId,
    milestone_id: input.milestoneId || null,
    title: input.title,
    details: encodeTaskDetails({
      skill: input.skill,
      durationMinutes: input.durationMinutes,
      description: input.description,
    }),
    scheduled_on: input.scheduledOn,
    position,
    status: "pending",
    completed_at: null,
  });

  if (inserted.error?.code === "23505") {
    const retry = await supabase.from("study_tasks").insert({
      user_id: userId,
      study_plan_id: context.planId,
      milestone_id: input.milestoneId || null,
      title: input.title,
      details: encodeTaskDetails({
        skill: input.skill,
        durationMinutes: input.durationMinutes,
        description: input.description,
      }),
      scheduled_on: input.scheduledOn,
      position: position + 1,
      status: "pending",
      completed_at: null,
    });

    if (retry.error) {
      logStudyPlanDiagnostic("insert-task-retry", retry.error);
      return { ok: false, reason: "failed" };
    }

    return { ok: true };
  }

  if (inserted.error) {
    logStudyPlanDiagnostic("insert-task", inserted.error);
    return { ok: false, reason: "failed" };
  }

  return { ok: true };
}

export async function updateStudyTask(
  userId: string,
  taskId: string,
  input: StudyTaskInput,
): Promise<StudyPlanMutation> {
  const context = await loadCurrentPlan(userId);

  if (!context.ok) {
    return planFailure(context.reason);
  }

  if (input.milestoneId && !context.milestones.has(input.milestoneId)) {
    return { ok: false, reason: "invalid-milestone" };
  }

  const supabase = await createSupabaseServerClient();
  const updated = await supabase
    .from("study_tasks")
    .update({
      title: input.title,
      details: encodeTaskDetails({
        skill: input.skill,
        durationMinutes: input.durationMinutes,
        description: input.description,
      }),
      scheduled_on: input.scheduledOn,
      milestone_id: input.milestoneId || null,
    })
    .eq("id", taskId)
    .eq("user_id", userId)
    .eq("study_plan_id", context.planId)
    .select("id");

  if (updated.error) {
    logStudyPlanDiagnostic("update-task", updated.error);
    return { ok: false, reason: "failed" };
  }

  if (!updated.data || updated.data.length === 0) {
    return { ok: false, reason: "missing-task" };
  }

  return { ok: true };
}

export async function setStudyTaskStatus(
  userId: string,
  taskId: string,
  status: StudyTaskStatus,
): Promise<StudyPlanMutation> {
  const context = await loadCurrentPlan(userId);

  if (!context.ok) {
    return planFailure(context.reason);
  }

  const supabase = await createSupabaseServerClient();
  const updated = await supabase
    .from("study_tasks")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("user_id", userId)
    .eq("study_plan_id", context.planId)
    .select("id, title");

  if (updated.error) {
    logStudyPlanDiagnostic("update-status", updated.error);
    return { ok: false, reason: "failed" };
  }

  if (!updated.data || updated.data.length === 0) {
    return { ok: false, reason: "missing-task" };
  }

  const title = readString(asRecord(updated.data[0]), "title");
  await recordTaskPerformance(
    userId,
    context.planId,
    status === "completed" ? "completed" : "reopened",
    title,
  );

  return { ok: true };
}

export async function deleteStudyTask(userId: string, taskId: string): Promise<StudyPlanMutation> {
  const context = await loadCurrentPlan(userId);

  if (!context.ok) {
    return planFailure(context.reason);
  }

  const supabase = await createSupabaseServerClient();
  const deleted = await supabase
    .from("study_tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId)
    .eq("study_plan_id", context.planId)
    .select("id");

  if (deleted.error) {
    logStudyPlanDiagnostic("delete-task", deleted.error);
    return { ok: false, reason: "failed" };
  }

  if (!deleted.data || deleted.data.length === 0) {
    return { ok: false, reason: "missing-task" };
  }

  return { ok: true };
}

async function loadTasks(userId: string, planId: string): Promise<
  | { ok: true; tasks: Array<Omit<StudyPlanDashboard["tasks"][number], "milestoneTitle">> }
  | { ok: false }
> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("study_tasks")
    .select("id, title, details, scheduled_on, status, milestone_id")
    .eq("user_id", userId)
    .eq("study_plan_id", planId)
    .order("scheduled_on", { ascending: true })
    .order("position", { ascending: true });

  if (result.error) {
    logStudyPlanDiagnostic("load-tasks", result.error);
    return { ok: false };
  }

  const tasks = (result.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const id = readString(record, "id");
    const title = readString(record, "title");
    const scheduledOn = readString(record, "scheduled_on");
    const status = readString(record, "status");

    if (!id || !title || !scheduledOn || !isTaskStatus(status)) {
      return [];
    }

    const details = decodeTaskDetails(readString(record, "details"));
    return [{
      id,
      title,
      description: details.description,
      skill: details.skill,
      scheduledOn,
      durationMinutes: details.durationMinutes,
      status,
      milestoneId: readString(record, "milestone_id"),
    }];
  });

  return { ok: true, tasks };
}

async function ensureCurrentPlan(userId: string): Promise<
  | ({ ok: true } & PlanContext)
  | { ok: false; reason: "unauthenticated" | "missing-roadmap" | "failed" }
> {
  const existing = await loadCurrentPlan(userId);

  if (existing.ok) {
    return existing;
  }

  if (existing.reason !== "missing-plan") {
    return { ok: false, reason: existing.reason };
  }

  const user = await getAuthenticatedUser();

  if (!user || user.id !== userId) {
    return { ok: false, reason: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const roadmap = await currentRoadmap(userId);

  if (!roadmap.ok) {
    return roadmap;
  }

  const inserted = await supabase
    .from("study_plans")
    .insert({
      user_id: userId,
      roadmap_id: roadmap.roadmapId,
      title: clip(`Study plan for ${roadmap.title}`, 180),
      summary: "Tasks for the current roadmap.",
      status: "active",
      is_current: true,
    })
    .select("id")
    .maybeSingle();

  if (inserted.error?.code === "23505") {
    const again = await loadCurrentPlan(userId);
    return again.ok ? again : { ok: false, reason: "failed" };
  }

  if (inserted.error || !inserted.data) {
    logStudyPlanDiagnostic("insert-plan", inserted.error);
    return { ok: false, reason: "failed" };
  }

  const planId = readString(asRecord(inserted.data), "id");

  if (!planId) {
    return { ok: false, reason: "failed" };
  }

  return { ok: true, planId, milestones: roadmap.milestones };
}

async function loadCurrentPlan(userId: string): Promise<
  | ({ ok: true } & PlanContext)
  | { ok: false; reason: "unauthenticated" | "missing-roadmap" | "missing-plan" | "failed" }
> {
  const user = await getAuthenticatedUser();

  if (!user || user.id !== userId) {
    return { ok: false, reason: "unauthenticated" };
  }

  const roadmap = await currentRoadmap(userId);

  if (!roadmap.ok) {
    return roadmap;
  }

  const supabase = await createSupabaseServerClient();
  const planResult = await supabase
    .from("study_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("roadmap_id", roadmap.roadmapId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planResult.error) {
    logStudyPlanDiagnostic("load-current-plan", planResult.error);
    return { ok: false, reason: "failed" };
  }

  const planId = readString(asRecord(planResult.data), "id");

  if (!planId) {
    return { ok: false, reason: "missing-plan" };
  }

  return { ok: true, planId, milestones: roadmap.milestones };
}

async function currentRoadmap(userId: string): Promise<
  | { ok: true; roadmapId: string; title: string; milestones: Map<string, string> }
  | { ok: false; reason: "missing-roadmap" | "failed" }
> {
  const supabase = await createSupabaseServerClient();
  const roadmapResult = await supabase
    .from("roadmaps")
    .select("id, title")
    .eq("user_id", userId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roadmapResult.error) {
    logStudyPlanDiagnostic("load-current-roadmap", roadmapResult.error);
    return { ok: false, reason: "failed" };
  }

  const roadmap = asRecord(roadmapResult.data);
  const roadmapId = readString(roadmap, "id");

  if (!roadmapId) {
    return { ok: false, reason: "missing-roadmap" };
  }

  const milestoneResult = await supabase
    .from("roadmap_milestones")
    .select("id, title")
    .eq("user_id", userId)
    .eq("roadmap_id", roadmapId);

  if (milestoneResult.error) {
    logStudyPlanDiagnostic("load-plan-milestones", milestoneResult.error);
    return { ok: false, reason: "failed" };
  }

  const milestones = new Map<string, string>();

  for (const row of milestoneResult.data ?? []) {
    const record = asRecord(row);
    const id = readString(record, "id");
    const title = readString(record, "title");

    if (id && title) {
      milestones.set(id, title);
    }
  }

  return {
    ok: true,
    roadmapId,
    title: readString(roadmap, "title") || "your roadmap",
    milestones,
  };
}

async function nextPosition(userId: string, planId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("study_tasks")
    .select("position")
    .eq("user_id", userId)
    .eq("study_plan_id", planId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    logStudyPlanDiagnostic("load-position", result.error);
    return 0;
  }

  return readNumber(asRecord(result.data), "position") ?? 0;
}

function planFailure(reason: "unauthenticated" | "missing-roadmap" | "missing-plan" | "failed"): StudyPlanMutation {
  if (reason === "missing-plan") {
    return { ok: false, reason: "missing-task" };
  }

  return { ok: false, reason };
}

function isTaskStatus(value: string): value is StudyTaskStatus {
  return value === "pending" || value === "completed";
}

function uniqueSubjects(values: string[]): string[] {
  const seen = new Set<string>();
  const subjects: string[] = [];

  for (const value of values) {
    const skill = value.trim();
    const key = skill.toLowerCase();

    if (!skill || seen.has(key) || subjects.length >= 8) {
      continue;
    }

    seen.add(key);
    subjects.push(skill);
  }

  return subjects;
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}…`;
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

function readNumber(record: Record<string, unknown> | null, key: string): number | null {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function logStudyPlanDiagnostic(step: string, error: { message: string; code?: string } | null) {
  if (process.env.NODE_ENV === "production" || !error) {
    return;
  }

  console.error(`[study-plan:${step}] ${error.code ?? "none"}: ${error.message}`);
}
