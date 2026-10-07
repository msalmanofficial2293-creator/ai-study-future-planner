import "server-only";

import {
  EDUCATION_LEVELS,
  LEARNING_STYLES,
  SKILL_LEVELS,
} from "@/features/onboarding/options";
import { decodeQuizTitle } from "@/features/quiz/record";
import { decodeMilestoneDescription } from "@/features/roadmap/record";
import { decodeTaskDetails } from "@/features/study-plan/record";
import { currentStage, todayIso } from "@/features/study-plan/schedule";
import type { StudyTaskStatus } from "@/features/study-plan/types";
import type {
  TutorContext,
  TutorLearningStyle,
  TutorMiss,
  TutorSkillLevel,
  TutorSkillScore,
  TutorTaskBrief,
} from "@/features/tutor/types";
import { profileIsComplete } from "@/services/onboarding-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MilestoneRow = {
  id: string;
  title: string;
  position: number;
  skills: string[];
};

type AttemptRow = {
  id: string;
  quizId: string;
  score: number | null;
};

export async function loadTutorContext(
  userId: string,
): Promise<TutorContext | "incomplete" | "unavailable"> {
  const supabase = await createSupabaseServerClient();
  const [profileResult, goalResult, roadmapResult, attemptResult, adaptiveResult, performanceResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("education_level, field_of_study, skill_level, learning_style, onboarding_completed_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("goals")
        .select("title")
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
        .from("quiz_attempts")
        .select("id, quiz_id, score, submitted_at")
        .eq("user_id", userId)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(8),
      supabase
        .from("adaptive_plans")
        .select("rationale")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("performance_records")
        .select("summary")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (
    profileResult.error ||
    goalResult.error ||
    roadmapResult.error ||
    attemptResult.error ||
    adaptiveResult.error ||
    performanceResult.error
  ) {
    logTutor("context", profileResult.error ?? goalResult.error ?? roadmapResult.error ?? attemptResult.error);
    return "unavailable";
  }

  if (!profileIsComplete(profileResult.data)) {
    return "incomplete";
  }

  const profile = asRecord(profileResult.data);
  const roadmap = asRecord(roadmapResult.data);
  const roadmapId = readString(roadmap, "id");
  const attempts = (attemptResult.data ?? []).flatMap((row) => readAttempt(row));
  const [milestoneResult, planResult] = roadmapId
    ? await Promise.all([
        supabase
          .from("roadmap_milestones")
          .select("id, title, position, description")
          .eq("user_id", userId)
          .eq("roadmap_id", roadmapId)
          .order("position", { ascending: true })
          .limit(12),
        supabase
          .from("study_plans")
          .select("id, title")
          .eq("user_id", userId)
          .eq("roadmap_id", roadmapId)
          .eq("is_current", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
    : [null, null];

  if (milestoneResult?.error || planResult?.error) {
    logTutor("plan", milestoneResult?.error ?? planResult?.error ?? null);
    return "unavailable";
  }

  const milestones = (milestoneResult?.data ?? []).flatMap((row) => readMilestone(row));
  const plan = asRecord(planResult?.data);
  const planId = readString(plan, "id");
  const taskResult = planId
    ? await supabase
        .from("study_tasks")
        .select("title, details, scheduled_on, status, milestone_id")
        .eq("user_id", userId)
        .eq("study_plan_id", planId)
        .order("scheduled_on", { ascending: true })
        .limit(40)
    : null;

  if (taskResult?.error) {
    logTutor("tasks", taskResult.error);
    return "unavailable";
  }

  const tasks = (taskResult?.data ?? []).flatMap((row) => readTask(row));
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
  const stageRow = milestones.find((milestone) => milestone.id === stage?.id) ?? null;
  const answerBundle = await loadAnswers(userId, attempts);

  if (!answerBundle) {
    return "unavailable";
  }

  const today = todayIso();
  const pending = tasks.filter((task) => task.status === "pending");
  const skillLevel = readSkillLevel(readString(profile, "skill_level"));
  const learningStyle = readLearningStyle(readString(profile, "learning_style"));

  return {
    educationLabel: labelFor(EDUCATION_LEVELS, readString(profile, "education_level")),
    field: readString(profile, "field_of_study"),
    skillLevel,
    skillLabel: labelFor(SKILL_LEVELS, skillLevel),
    learningStyle,
    learningLabel: labelFor(LEARNING_STYLES, learningStyle),
    goalTitle: readString(asRecord(goalResult.data), "title"),
    roadmapTitle: readString(roadmap, "title"),
    stageTitle: stage?.title ?? null,
    stageSkills: stageRow?.skills.slice(0, 4) ?? [],
    planTitle: readString(plan, "title"),
    todayTasks: pending.filter((task) => task.scheduledOn <= today).slice(0, 4),
    upcomingTasks: pending.filter((task) => task.scheduledOn > today).slice(0, 2),
    scores: answerBundle.scores,
    misses: answerBundle.misses,
    latestQuiz: answerBundle.latestQuiz,
    adaptiveNote: clip(readString(asRecord(adaptiveResult.data), "rationale"), 180),
    performanceNote: clip(readString(asRecord(performanceResult.data), "summary"), 160),
  };
}

async function loadAnswers(
  userId: string,
  attempts: AttemptRow[],
): Promise<{ scores: TutorSkillScore[]; misses: TutorMiss[]; latestQuiz: TutorContext["latestQuiz"] } | null> {
  if (attempts.length === 0) {
    return { scores: [], misses: [], latestQuiz: null };
  }

  const supabase = await createSupabaseServerClient();
  const attemptIds = attempts.map((attempt) => attempt.id);
  const quizIds = [...new Set(attempts.map((attempt) => attempt.quizId))];
  const [answerResult, quizResult] = await Promise.all([
    supabase
      .from("quiz_answers")
      .select("attempt_id, question_id, is_correct")
      .eq("user_id", userId)
      .in("attempt_id", attemptIds),
    supabase.from("quizzes").select("id, title").eq("user_id", userId).in("id", quizIds),
  ]);

  if (answerResult.error || quizResult.error) {
    logTutor("answers", answerResult.error ?? quizResult.error);
    return null;
  }

  const skills = new Map<string, string>();

  for (const row of quizResult.data ?? []) {
    const record = asRecord(row);
    const id = readString(record, "id");

    if (id) {
      skills.set(id, decodeQuizTitle(readString(record, "title") ?? "").skill);
    }
  }

  const totals = new Map<string, { correct: number; total: number }>();

  for (const row of answerResult.data ?? []) {
    const record = asRecord(row);
    const attemptId = readString(record, "attempt_id");
    const attempt = attempts.find((item) => item.id === attemptId);
    const skill = attempt ? skills.get(attempt.quizId) : null;

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

  const latest = attempts[0] ?? null;
  const latestSkill = latest ? (skills.get(latest.quizId) ?? null) : null;
  const latestTitle = latest
    ? decodeQuizTitle(
        readString(
          asRecord((quizResult.data ?? []).find((row) => readString(asRecord(row), "id") === latest.quizId)),
          "title",
        ) ?? "",
      ).title
    : null;
  const incorrectIds = (answerResult.data ?? [])
    .flatMap((row) => {
      const record = asRecord(row);

      if (readString(record, "attempt_id") !== latest?.id || record.is_correct !== false) {
        return [];
      }

      const questionId = readString(record, "question_id");
      return questionId ? [questionId] : [];
    })
    .slice(0, 2);
  const questionResult =
    incorrectIds.length > 0
      ? await supabase
          .from("quiz_questions")
          .select("id, prompt, explanation")
          .eq("user_id", userId)
          .in("id", incorrectIds)
      : null;

  if (questionResult?.error) {
    logTutor("questions", questionResult.error);
    return null;
  }

  const misses = (questionResult?.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const prompt = readString(record, "prompt");

    if (!prompt || !latestSkill) {
      return [];
    }

    return [
      {
        prompt: clip(prompt, 180) ?? prompt,
        explanation: clip(readString(record, "explanation"), 180),
        skill: latestSkill,
      },
    ];
  });

  return {
    scores: [...totals.entries()].flatMap(([skill, total]) => {
      if (total.total < 1) {
        return [];
      }

      return [
        {
          skill,
          correct: total.correct,
          total: total.total,
          percent: Math.round((total.correct / total.total) * 100),
        },
      ];
    }),
    misses,
    latestQuiz:
      latest && latestTitle && latestSkill && latest.score !== null
        ? { title: latestTitle, skill: latestSkill, percent: latest.score }
        : null,
  };
}

function readAttempt(row: unknown): AttemptRow[] {
  const record = asRecord(row);
  const id = readString(record, "id");
  const quizId = readString(record, "quiz_id");

  if (!id || !quizId) {
    return [];
  }

  return [{ id, quizId, score: readPercent(record.score) }];
}

function readMilestone(row: unknown): MilestoneRow[] {
  const record = asRecord(row);
  const id = readString(record, "id");
  const title = readString(record, "title");
  const position = readInteger(record.position);

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

function readTask(row: unknown): Array<TutorTaskBrief & { status: string; milestoneId: string | null }> {
  const record = asRecord(row);
  const title = readString(record, "title");
  const scheduledOn = readString(record, "scheduled_on");
  const status = readString(record, "status");

  if (!title || !scheduledOn || !status) {
    return [];
  }

  return [
    {
      title,
      skill: decodeTaskDetails(readString(record, "details") ?? "").skill,
      scheduledOn,
      status,
      milestoneId: readString(record, "milestone_id"),
    },
  ];
}

function isTaskStatus(value: string): value is StudyTaskStatus {
  return value === "pending" || value === "completed";
}

function readSkillLevel(value: string | null): TutorSkillLevel | null {
  if (value === "beginner" || value === "intermediate" || value === "advanced") {
    return value;
  }

  return null;
}

function readLearningStyle(value: string | null): TutorLearningStyle | null {
  if (value === "reading" || value === "practice" || value === "video" || value === "mixed") {
    return value;
  }

  return null;
}

function labelFor(
  options: readonly { value: string; label: string }[],
  value: string | null,
): string | null {
  if (!value) {
    return null;
  }

  return options.find((option) => option.value === value)?.label ?? null;
}

function readPercent(value: unknown): number | null {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isFinite(number) || number < 0 || number > 100) {
    return null;
  }

  return Math.round(number);
}

function clip(value: string | null, max: number): string | null {
  if (!value) {
    return null;
  }

  const clean = value.replace(/\s+/g, " ").trim();

  if (!clean) {
    return null;
  }

  if (clean.length <= max) {
    return clean;
  }

  return `${clean.slice(0, max - 1).trim()}…`;
}

function readInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function logTutor(step: string, error: { message: string; code?: string } | null): void {
  if (process.env.NODE_ENV === "production" || !error) {
    return;
  }

  console.error(`[tutor:${step}] ${error.code ?? "none"}`);
}
