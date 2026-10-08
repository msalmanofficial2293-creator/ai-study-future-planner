import "server-only";

import {
  EDUCATION_LEVELS,
  LEARNING_STYLES,
  SKILL_LEVELS,
  WEEKLY_STUDY_TIMES,
} from "@/features/onboarding/options";
import { logServerDiagnostic } from "@/lib/security/log";
import { profileIsComplete } from "@/services/onboarding-status";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

export type FuturePlannerView = {
  careerGoal: string;
  targetOutcome: string;
  educationLevel: string;
  fieldOfStudy: string;
  skillLevel: string;
  weeklyStudyTime: string;
  learningStyle: string;
  hasGoal: boolean;
};

export type FuturePlannerLoad =
  | { status: "unauthenticated" }
  | { status: "incomplete" }
  | { status: "unavailable" }
  | { status: "ready"; planner: FuturePlannerView };

export type FuturePlannerSaveResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "failed" };

export async function loadFuturePlanner(): Promise<FuturePlannerLoad> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const profileResult = await supabase
    .from("profiles")
    .select(
      "education_level, field_of_study, skill_level, weekly_study_time, learning_style, onboarding_completed_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    logPlannerDiagnostic("load-profile", profileResult.error);
    return { status: "unavailable" };
  }

  if (!profileIsComplete(profileResult.data)) {
    return { status: "incomplete" };
  }

  const goalResult = await supabase
    .from("goals")
    .select("title, description")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (goalResult.error) {
    logPlannerDiagnostic("load-goal", goalResult.error);
    return { status: "unavailable" };
  }

  const profile = asRecord(profileResult.data);
  const goal = asRecord(goalResult.data);
  const careerGoal = readString(goal, "title");
  const targetOutcome = readString(goal, "description");

  return {
    status: "ready",
    planner: {
      careerGoal,
      targetOutcome,
      educationLevel: optionLabel(EDUCATION_LEVELS, readString(profile, "education_level")),
      fieldOfStudy: readString(profile, "field_of_study") || "Not set yet",
      skillLevel: optionLabel(SKILL_LEVELS, readString(profile, "skill_level")),
      weeklyStudyTime: optionLabel(WEEKLY_STUDY_TIMES, readString(profile, "weekly_study_time")),
      learningStyle: optionLabel(LEARNING_STYLES, readString(profile, "learning_style")),
      hasGoal: careerGoal.length > 0,
    },
  };
}

export async function saveFuturePlannerGoal(
  userId: string,
  careerGoal: string,
  targetOutcome: string,
): Promise<FuturePlannerSaveResult> {
  const user = await getAuthenticatedUser();

  if (!user || user.id !== userId) {
    return { ok: false, reason: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const existingGoal = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingGoal.error) {
    logPlannerDiagnostic("read-goal", existingGoal.error);
    return { ok: false, reason: "failed" };
  }

  const goalId = readString(asRecord(existingGoal.data), "id");
  const goalWrite = goalId
    ? await supabase
        .from("goals")
        .update({
          title: careerGoal,
          description: targetOutcome,
          status: "active",
        })
        .eq("id", goalId)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("goals")
        .insert({
          user_id: userId,
          title: careerGoal,
          description: targetOutcome,
          status: "active",
        })
        .select("id")
        .maybeSingle();

  if (goalWrite.error || !goalWrite.data) {
    logPlannerDiagnostic("write-goal", goalWrite.error);
    return { ok: false, reason: "failed" };
  }

  return { ok: true };
}

function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? "Not set yet";
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

function logPlannerDiagnostic(
  step: string,
  error: { message: string; code?: string } | null,
) {
  logServerDiagnostic("future-planner", step, error);
}
