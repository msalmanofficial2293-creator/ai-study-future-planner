import {
  isEducationLevel,
  isLearningStyle,
  isSkillLevel,
  isWeeklyStudyTime,
  type EducationLevel,
  type LearningStyle,
  type SkillLevel,
  type WeeklyStudyTime,
} from "@/features/onboarding/options";
import type { OnboardingInput } from "@/features/onboarding/validation";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

export type OnboardingLoad =
  | { status: "completed" }
  | { status: "ready"; draft: OnboardingInput }
  | { status: "unavailable" };

export type OnboardingSaveResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "completed" | "missing-profile" | "failed" };

const emptyDraft: OnboardingInput = {
  fullName: "",
  educationLevel: "",
  fieldOfStudy: "",
  skillLevel: "",
  careerGoal: "",
  targetOutcome: "",
  weeklyStudyTime: "",
  learningStyle: "",
};

export async function loadOnboarding(fallbackName: string): Promise<OnboardingLoad> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { status: "unavailable" };
  }

  const supabase = await createSupabaseServerClient();
  const profileResult = await supabase
    .from("profiles")
    .select(
      "full_name, education_level, field_of_study, skill_level, weekly_study_time, learning_style, onboarding_completed_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    logOnboardingDiagnostic("load-profile", profileResult.error);
    return { status: "unavailable" };
  }

  const profile = asRecord(profileResult.data);

  if (readTimestamp(profile, "onboarding_completed_at")) {
    return { status: "completed" };
  }

  const goalResult = await supabase
    .from("goals")
    .select("title, description")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (goalResult.error) {
    logOnboardingDiagnostic("load-goal", goalResult.error);
    return { status: "unavailable" };
  }

  const goal = asRecord(goalResult.data);
  const savedName = readString(profile, "full_name");

  return {
    status: "ready",
    draft: {
      ...emptyDraft,
      fullName: savedName || fallbackName,
      educationLevel: readChoice(profile, "education_level", isEducationLevel),
      fieldOfStudy: readString(profile, "field_of_study"),
      skillLevel: readChoice(profile, "skill_level", isSkillLevel),
      weeklyStudyTime: readChoice(profile, "weekly_study_time", isWeeklyStudyTime),
      learningStyle: readChoice(profile, "learning_style", isLearningStyle),
      careerGoal: readString(goal, "title"),
      targetOutcome: readString(goal, "description"),
    },
  };
}

export async function saveOnboarding(
  userId: string,
  input: OnboardingInput & {
    educationLevel: EducationLevel;
    skillLevel: SkillLevel;
    weeklyStudyTime: WeeklyStudyTime;
    learningStyle: LearningStyle;
  },
): Promise<OnboardingSaveResult> {
  const user = await getAuthenticatedUser();

  if (!user || user.id !== userId) {
    return { ok: false, reason: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const existingProfile = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile.error) {
    logOnboardingDiagnostic("read-profile", existingProfile.error);
    return { ok: false, reason: "failed" };
  }

  if (readTimestamp(asRecord(existingProfile.data), "onboarding_completed_at")) {
    return { ok: false, reason: "completed" };
  }

  if (!existingProfile.data) {
    return { ok: false, reason: "missing-profile" };
  }

  const existingGoal = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingGoal.error) {
    logOnboardingDiagnostic("read-goal", existingGoal.error);
    return { ok: false, reason: "failed" };
  }

  const goalId = readString(asRecord(existingGoal.data), "id");
  const goalWrite = goalId
    ? await supabase
        .from("goals")
        .update({
          title: input.careerGoal,
          description: input.targetOutcome,
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
          title: input.careerGoal,
          description: input.targetOutcome,
          status: "active",
        })
        .select("id")
        .maybeSingle();

  if (goalWrite.error || !goalWrite.data) {
    logOnboardingDiagnostic("write-goal", goalWrite.error);
    return { ok: false, reason: "failed" };
  }

  const profileWrite = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      education_level: input.educationLevel,
      field_of_study: input.fieldOfStudy,
      skill_level: input.skillLevel,
      weekly_study_time: input.weeklyStudyTime,
      learning_style: input.learningStyle,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (profileWrite.error) {
    logOnboardingDiagnostic("write-profile", profileWrite.error);
    return { ok: false, reason: "failed" };
  }

  if (!profileWrite.data) {
    return { ok: false, reason: "missing-profile" };
  }

  return { ok: true };
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

function readTimestamp(record: Record<string, unknown> | null, key: string): string {
  const value = record?.[key];
  return typeof value === "string" ? value : "";
}

function readChoice(
  record: Record<string, unknown> | null,
  key: string,
  matches: (value: string) => boolean,
): string {
  const value = readString(record, key);
  return matches(value) ? value : "";
}

function logOnboardingDiagnostic(
  step: string,
  error: { message: string; code?: string } | null,
) {
  if (process.env.NODE_ENV === "production" || !error) {
    return;
  }

  console.error(`[onboarding:${step}]`, {
    code: error.code ?? null,
    message: error.message,
  });
}
