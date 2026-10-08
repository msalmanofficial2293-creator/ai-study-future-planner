import "server-only";

import {
  EDUCATION_LEVELS,
  LEARNING_STYLES,
  SKILL_LEVELS,
  WEEKLY_STUDY_TIMES,
  isLearningStyle,
  isSkillLevel,
  isWeeklyStudyTime,
} from "@/features/onboarding/options";
import { buildPersonalization } from "@/features/personalization/engine";
import type {
  PersonalizationMutation,
  PersonalizationPage,
  PersonalizationProfile,
  PersonalizationTutorSummary,
  PersonalizedRecommendation,
} from "@/features/personalization/types";
import { decodeQuizTitle } from "@/features/quiz/record";
import { decodeMilestoneDescription } from "@/features/roadmap/record";
import { decodeTaskDetails } from "@/features/study-plan/record";
import { currentStage, todayIso } from "@/features/study-plan/schedule";
import type { StudyTaskStatus } from "@/features/study-plan/types";
import { profileIsComplete } from "@/services/onboarding-status";
import { createStudyTask } from "@/services/study-plan";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

type MilestoneRow = {
  id: string;
  title: string;
  position: number;
  skills: string[];
};

type TaskRow = {
  title: string;
  skill: string;
  status: string;
  scheduledOn: string;
  durationMinutes: number;
  milestoneId: string | null;
};

type ReadyContext = {
  profile: PersonalizationProfile;
  planId: string;
  planTitle: string;
  roadmapTitle: string;
  stageTitle: string | null;
  milestones: MilestoneRow[];
  tasks: TaskRow[];
  skills: Array<{ skill: string; correct: number; total: number }>;
  decisions: Map<string, "applied" | "dismissed">;
  recommendations: PersonalizedRecommendation[];
};

export async function loadPersonalizationPage(): Promise<PersonalizationPage> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const context = await loadContext(user.id);

  if (!context.ok) {
    if (context.reason === "insufficient") {
      return { status: "insufficient", profile: context.profile };
    }

    return { status: context.reason };
  }

  return {
    status: "ready",
    profile: context.profile,
    planTitle: context.planTitle,
    roadmapTitle: context.roadmapTitle,
    stageTitle: context.stageTitle,
    result: buildPersonalization({
      today: todayIso(),
      profile: context.profile,
      planTitle: context.planTitle,
      roadmapTitle: context.roadmapTitle,
      stageTitle: context.stageTitle,
      milestones: context.milestones,
      tasks: context.tasks,
      skills: context.skills,
      decisions: context.decisions,
    }),
  };
}

export async function loadPersonalizationTutorSummary(
  userId: string,
): Promise<PersonalizationTutorSummary | null> {
  const context = await loadContext(userId);

  if (!context.ok) {
    return null;
  }

  const result = buildPersonalization({
    today: todayIso(),
    profile: context.profile,
    planTitle: context.planTitle,
    roadmapTitle: context.roadmapTitle,
    stageTitle: context.stageTitle,
    milestones: context.milestones,
    tasks: context.tasks,
    skills: context.skills,
    decisions: context.decisions,
  });

  return {
    currentFocus: result.currentFocus,
    recommendedPriority: result.recommendedPriority,
    recommendedDifficulty: result.recommendedDifficulty,
    recommendedNextStep: result.recommendedNextStep,
    strongAreas: result.strongAreas.map((area) => area.skill).slice(0, 4),
    weakAreas: result.weakAreas.map((area) => area.skill).slice(0, 4),
  };
}

export async function applyPersonalizationRecommendation(
  userId: string,
  fingerprint: string,
): Promise<PersonalizationMutation> {
  const context = await loadContext(userId);

  if (!context.ok) {
    return { ok: false, reason: "failed" };
  }

  const result = buildPersonalization({
    today: todayIso(),
    profile: context.profile,
    planTitle: context.planTitle,
    roadmapTitle: context.roadmapTitle,
    stageTitle: context.stageTitle,
    milestones: context.milestones,
    tasks: context.tasks,
    skills: context.skills,
    decisions: context.decisions,
  });
  const recommendation = result.recommendations.find((item) => item.fingerprint === fingerprint);

  if (!recommendation) {
    return { ok: false, reason: "missing" };
  }

  if (recommendation.status === "dismissed") {
    return { ok: false, reason: "invalid" };
  }

  if (!recommendation.task) {
    const marked = await upsertDecision(userId, fingerprint, "applied");
    return marked ? { ok: true, added: 0 } : { ok: false, reason: "failed" };
  }

  if (recommendation.alreadyOnPlan || recommendation.status === "applied") {
    const marked = await upsertDecision(userId, fingerprint, "applied");
    return marked ? { ok: true, added: 0 } : { ok: false, reason: "already" };
  }

  const created = await createStudyTask(userId, {
    title: recommendation.task.title,
    description: recommendation.task.description,
    skill: recommendation.task.skill,
    scheduledOn: recommendation.task.scheduledOn,
    durationMinutes: recommendation.task.durationMinutes,
    milestoneId: recommendation.task.milestoneId,
  });

  if (!created.ok) {
    return { ok: false, reason: "failed" };
  }

  const marked = await upsertDecision(userId, fingerprint, "applied");
  return marked ? { ok: true, added: 1 } : { ok: false, reason: "failed" };
}

export async function dismissPersonalizationRecommendation(
  userId: string,
  fingerprint: string,
): Promise<PersonalizationMutation> {
  const context = await loadContext(userId);

  if (!context.ok) {
    return { ok: false, reason: "failed" };
  }

  const result = buildPersonalization({
    today: todayIso(),
    profile: context.profile,
    planTitle: context.planTitle,
    roadmapTitle: context.roadmapTitle,
    stageTitle: context.stageTitle,
    milestones: context.milestones,
    tasks: context.tasks,
    skills: context.skills,
    decisions: context.decisions,
  });
  const recommendation = result.recommendations.find((item) => item.fingerprint === fingerprint);

  if (!recommendation) {
    return { ok: false, reason: "missing" };
  }

  const marked = await upsertDecision(userId, fingerprint, "dismissed");
  return marked ? { ok: true, added: 0 } : { ok: false, reason: "failed" };
}

async function loadContext(userId: string): Promise<
  | ({ ok: true } & ReadyContext)
  | {
      ok: false;
      reason: "incomplete" | "unavailable" | "no-roadmap" | "no-plan" | "insufficient";
      profile: PersonalizationProfile;
    }
> {
  const supabase = await createSupabaseServerClient();
  const [profileResult, goalResult, roadmapResult, decisionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "education_level, field_of_study, skill_level, learning_style, weekly_study_time, onboarding_completed_at",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("title, description")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("roadmaps")
      .select("id, title")
      .eq("user_id", userId)
      .eq("is_current", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("personalization_decisions")
      .select("fingerprint, status")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(40),
  ]);

  if (profileResult.error || goalResult.error || roadmapResult.error || decisionResult.error) {
    logPersonalization("context", profileResult.error ?? goalResult.error ?? roadmapResult.error ?? decisionResult.error);
    return {
      ok: false,
      reason: "unavailable",
      profile: emptyProfile(),
    };
  }

  if (!profileIsComplete(profileResult.data)) {
    return { ok: false, reason: "incomplete", profile: emptyProfile() };
  }

  const profile = readProfile(profileResult.data, goalResult.data);
  const roadmap = asRecord(roadmapResult.data);
  const roadmapId = readString(roadmap, "id");
  const roadmapTitle = readString(roadmap, "title");

  if (!roadmapId || !roadmapTitle) {
    return { ok: false, reason: "no-roadmap", profile };
  }

  const [planResult, milestoneResult, taskResult, attemptResult] = await Promise.all([
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
      .select("id, title, position, description")
      .eq("user_id", userId)
      .eq("roadmap_id", roadmapId)
      .order("position", { ascending: true })
      .limit(12),
    supabase
      .from("study_tasks")
      .select("title, details, scheduled_on, status, milestone_id, study_plan_id")
      .eq("user_id", userId)
      .order("scheduled_on", { ascending: true })
      .limit(60),
    supabase
      .from("quiz_attempts")
      .select("id, quiz_id, score")
      .eq("user_id", userId)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(12),
  ]);

  if (planResult.error || milestoneResult.error || taskResult.error || attemptResult.error) {
    logPersonalization("plan", planResult.error ?? milestoneResult.error ?? taskResult.error ?? attemptResult.error);
    return { ok: false, reason: "unavailable", profile };
  }

  const plan = asRecord(planResult.data);
  const planId = readString(plan, "id");
  const planTitle = readString(plan, "title");

  if (!planId || !planTitle) {
    return { ok: false, reason: "no-plan", profile };
  }

  const milestones = (milestoneResult.data ?? []).flatMap((row) => readMilestone(row));
  const tasks = (taskResult.data ?? []).flatMap((row) => {
    const record = asRecord(row);

    if (readString(record, "study_plan_id") !== planId) {
      return [];
    }

    return readTask(row);
  });
  const stage = currentStage(
    milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      position: milestone.position,
    })),
    tasks.flatMap((task) =>
      task.milestoneId && isTaskStatus(task.status)
        ? [{ milestoneId: task.milestoneId, status: task.status }]
        : [],
    ),
  );
  const skills = await loadSkillScores(userId, attemptResult.data ?? []);

  if (skills === null) {
    return { ok: false, reason: "unavailable", profile };
  }

  if (skills.length === 0) {
    return { ok: false, reason: "insufficient", profile };
  }

  const decisions = new Map<string, "applied" | "dismissed">();

  for (const row of decisionResult.data ?? []) {
    const record = asRecord(row);
    const fingerprint = readString(record, "fingerprint");
    const status = readString(record, "status");

    if (!fingerprint || (status !== "applied" && status !== "dismissed") || decisions.has(fingerprint)) {
      continue;
    }

    decisions.set(fingerprint, status);
  }

  const built = buildPersonalization({
    today: todayIso(),
    profile,
    planTitle,
    roadmapTitle,
    stageTitle: stage?.title ?? null,
    milestones,
    tasks,
    skills,
    decisions,
  });

  return {
    ok: true,
    profile,
    planId,
    planTitle,
    roadmapTitle,
    stageTitle: stage?.title ?? null,
    milestones,
    tasks,
    skills,
    decisions,
    recommendations: built.recommendations,
  };
}

async function loadSkillScores(
  userId: string,
  attempts: unknown[],
): Promise<Array<{ skill: string; correct: number; total: number }> | null> {
  if (attempts.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const attemptIds = attempts.flatMap((row) => {
    const id = readString(asRecord(row), "id");
    return id ? [id] : [];
  });
  const quizIds = [...new Set(attempts.flatMap((row) => {
    const quizId = readString(asRecord(row), "quiz_id");
    return quizId ? [quizId] : [];
  }))];

  if (attemptIds.length === 0 || quizIds.length === 0) {
    return [];
  }

  const [answerResult, quizResult] = await Promise.all([
    supabase
      .from("quiz_answers")
      .select("attempt_id, is_correct")
      .eq("user_id", userId)
      .in("attempt_id", attemptIds),
    supabase.from("quizzes").select("id, title").eq("user_id", userId).in("id", quizIds),
  ]);

  if (answerResult.error || quizResult.error) {
    logPersonalization("scores", answerResult.error ?? quizResult.error);
    return null;
  }

  const skillByQuiz = new Map<string, string>();

  for (const row of quizResult.data ?? []) {
    const record = asRecord(row);
    const id = readString(record, "id");

    if (id) {
      skillByQuiz.set(id, decodeQuizTitle(readString(record, "title") ?? "").skill);
    }
  }

  const attemptSkill = new Map<string, string>();

  for (const row of attempts) {
    const record = asRecord(row);
    const id = readString(record, "id");
    const quizId = readString(record, "quiz_id");
    const skill = quizId ? skillByQuiz.get(quizId) : null;

    if (id && skill) {
      attemptSkill.set(id, skill);
    }
  }

  const totals = new Map<string, { correct: number; total: number }>();

  for (const row of answerResult.data ?? []) {
    const record = asRecord(row);
    const attemptId = readString(record, "attempt_id");
    const skill = attemptId ? attemptSkill.get(attemptId) : null;

    if (!skill) {
      continue;
    }

    const current = totals.get(skill) ?? { correct: 0, total: 0 };
    current.total += 1;

    if (record.is_correct === true) {
      current.correct += 1;
    }

    totals.set(skill, current);
  }

  return [...totals.entries()].map(([skill, total]) => ({
    skill,
    correct: total.correct,
    total: total.total,
  }));
}

async function upsertDecision(
  userId: string,
  fingerprint: string,
  status: "applied" | "dismissed",
): Promise<boolean> {
  const clean = fingerprint.trim().slice(0, 160);

  if (!clean) {
    return false;
  }

  const supabase = await createSupabaseServerClient();
  const existing = await supabase
    .from("personalization_decisions")
    .select("id")
    .eq("user_id", userId)
    .eq("fingerprint", clean)
    .maybeSingle();

  if (existing.error) {
    logPersonalization("decision-read", existing.error);
    return false;
  }

  if (readString(asRecord(existing.data), "id")) {
    const updated = await supabase
      .from("personalization_decisions")
      .update({ status })
      .eq("user_id", userId)
      .eq("fingerprint", clean);

    if (updated.error) {
      logPersonalization("decision-update", updated.error);
      return false;
    }

    return true;
  }

  const inserted = await supabase.from("personalization_decisions").insert({
    user_id: userId,
    fingerprint: clean,
    status,
  });

  if (inserted.error) {
    logPersonalization("decision-insert", inserted.error);
    return false;
  }

  return true;
}

function readProfile(profileData: unknown, goalData: unknown): PersonalizationProfile {
  const profile = asRecord(profileData);
  const goal = asRecord(goalData);
  const education = readString(profile, "education_level");
  const skillLevelRaw = readString(profile, "skill_level");
  const learningRaw = readString(profile, "learning_style");
  const weeklyRaw = readString(profile, "weekly_study_time");
  const skillLevel = skillLevelRaw && isSkillLevel(skillLevelRaw) ? skillLevelRaw : null;
  const learningStyle = learningRaw && isLearningStyle(learningRaw) ? learningRaw : null;
  const weeklyStudyTime = weeklyRaw && isWeeklyStudyTime(weeklyRaw) ? weeklyRaw : null;

  return {
    educationLabel: EDUCATION_LEVELS.find((option) => option.value === education)?.label ?? null,
    field: readString(profile, "field_of_study"),
    skillLevel,
    skillLabel: SKILL_LEVELS.find((option) => option.value === skillLevel)?.label ?? null,
    learningStyle,
    learningLabel: LEARNING_STYLES.find((option) => option.value === learningStyle)?.label ?? null,
    weeklyStudyTime,
    weeklyLabel: WEEKLY_STUDY_TIMES.find((option) => option.value === weeklyStudyTime)?.label ?? null,
    goalTitle: readString(goal, "title"),
    targetOutcome: readString(goal, "description"),
  };
}

function emptyProfile(): PersonalizationProfile {
  return {
    educationLabel: null,
    field: null,
    skillLevel: null,
    skillLabel: null,
    learningStyle: null,
    learningLabel: null,
    weeklyStudyTime: null,
    weeklyLabel: null,
    goalTitle: null,
    targetOutcome: null,
  };
}

function readMilestone(row: unknown): MilestoneRow[] {
  const record = asRecord(row);
  const id = readString(record, "id");
  const title = readString(record, "title");
  const position = typeof record.position === "number" && Number.isInteger(record.position) ? record.position : null;

  if (!id || !title || position === null) {
    return [];
  }

  return [
    {
      id,
      title,
      position,
      skills: decodeMilestoneDescription(readString(record, "description") ?? "").skills,
    },
  ];
}

function readTask(row: unknown): TaskRow[] {
  const record = asRecord(row);
  const title = readString(record, "title");
  const scheduledOn = readString(record, "scheduled_on");
  const status = readString(record, "status");
  const details = decodeTaskDetails(readString(record, "details") ?? "");

  if (!title || !scheduledOn || !status) {
    return [];
  }

  return [
    {
      title,
      skill: details.skill,
      status,
      scheduledOn,
      durationMinutes: details.durationMinutes,
      milestoneId: readString(record, "milestone_id"),
    },
  ];
}

function isTaskStatus(value: string): value is StudyTaskStatus {
  return value === "pending" || value === "completed";
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function logPersonalization(step: string, error: { message: string; code?: string } | null): void {
  if (process.env.NODE_ENV === "production" || !error) {
    return;
  }

  console.error(`[personalization:${step}] ${error.code ?? "none"}`);
}
