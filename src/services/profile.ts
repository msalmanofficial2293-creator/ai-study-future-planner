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
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

export type ProfileRecord = {
  email: string;
  fullName: string;
  username: string;
  bio: string;
  educationLevel: string;
  fieldOfStudy: string;
  skillLevel: string;
  weeklyStudyTime: string;
  learningStyle: string;
  careerGoal: string;
  targetOutcome: string;
  interests: string;
  notifyStudyReminders: boolean;
  notifyProductUpdates: boolean;
};

export type ProfileLoad =
  | { status: "unauthenticated" }
  | { status: "missing" }
  | { status: "unavailable" }
  | { status: "ready"; profile: ProfileRecord };

export type ProfileSaveResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "missing" | "username-taken" | "failed" };

export type ProfileUpdate = {
  fullName: string;
  username: string;
  bio: string;
  educationLevel: EducationLevel;
  fieldOfStudy: string;
  skillLevel: SkillLevel;
  weeklyStudyTime: WeeklyStudyTime;
  learningStyle: LearningStyle;
  careerGoal: string;
  targetOutcome: string;
  interests: string;
};

export type NotificationPreferences = {
  notifyStudyReminders: boolean;
  notifyProductUpdates: boolean;
};

export async function loadProfile(): Promise<ProfileLoad> {
  const user = await getAuthenticatedUser();

  if (!user?.email) {
    return { status: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const profileResult = await supabase
    .from("profiles")
    .select(
      "full_name, username, bio, education_level, field_of_study, skill_level, weekly_study_time, learning_style, interests, notify_study_reminders, notify_product_updates",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    logProfileDiagnostic("load-profile", profileResult.error);
    return { status: "unavailable" };
  }

  if (!profileResult.data) {
    return { status: "missing" };
  }

  const goalResult = await supabase
    .from("goals")
    .select("title, description")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (goalResult.error) {
    logProfileDiagnostic("load-goal", goalResult.error);
    return { status: "unavailable" };
  }

  const profile = asRecord(profileResult.data);
  const goal = asRecord(goalResult.data);

  return {
    status: "ready",
    profile: {
      email: user.email,
      fullName: readString(profile, "full_name"),
      username: readString(profile, "username"),
      bio: readString(profile, "bio"),
      educationLevel: readChoice(profile, "education_level", isEducationLevel),
      fieldOfStudy: readString(profile, "field_of_study"),
      skillLevel: readChoice(profile, "skill_level", isSkillLevel),
      weeklyStudyTime: readChoice(profile, "weekly_study_time", isWeeklyStudyTime),
      learningStyle: readChoice(profile, "learning_style", isLearningStyle),
      careerGoal: readString(goal, "title"),
      targetOutcome: readString(goal, "description"),
      interests: readString(profile, "interests"),
      notifyStudyReminders: readBoolean(profile, "notify_study_reminders", true),
      notifyProductUpdates: readBoolean(profile, "notify_product_updates", false),
    },
  };
}

export async function saveProfile(userId: string, input: ProfileUpdate): Promise<ProfileSaveResult> {
  const user = await getAuthenticatedUser();

  if (!user || user.id !== userId) {
    return { ok: false, reason: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const profileWrite = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      username: input.username,
      bio: input.bio || null,
      education_level: input.educationLevel,
      field_of_study: input.fieldOfStudy,
      skill_level: input.skillLevel,
      weekly_study_time: input.weeklyStudyTime,
      learning_style: input.learningStyle,
      interests: input.interests || null,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (profileWrite.error) {
    logProfileDiagnostic("write-profile", profileWrite.error);
    return { ok: false, reason: isUniqueViolation(profileWrite.error) ? "username-taken" : "failed" };
  }

  if (!profileWrite.data) {
    return { ok: false, reason: "missing" };
  }

  const existingGoal = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingGoal.error) {
    logProfileDiagnostic("read-goal", existingGoal.error);
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
    logProfileDiagnostic("write-goal", goalWrite.error);
    return { ok: false, reason: "failed" };
  }

  return { ok: true };
}

export async function saveNotificationPreferences(
  userId: string,
  input: NotificationPreferences,
): Promise<ProfileSaveResult> {
  const user = await getAuthenticatedUser();

  if (!user || user.id !== userId) {
    return { ok: false, reason: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const write = await supabase
    .from("profiles")
    .update({
      notify_study_reminders: input.notifyStudyReminders,
      notify_product_updates: input.notifyProductUpdates,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (write.error) {
    logProfileDiagnostic("write-notifications", write.error);
    return { ok: false, reason: "failed" };
  }

  if (!write.data) {
    return { ok: false, reason: "missing" };
  }

  return { ok: true };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isUniqueViolation(error: { code?: string; message: string }): boolean {
  return error.code === "23505" || error.message.toLowerCase().includes("profiles_username_key");
}

function readBoolean(record: Record<string, unknown> | null, key: string, fallback: boolean): boolean {
  const value = record?.[key];
  return typeof value === "boolean" ? value : fallback;
}

function readString(record: Record<string, unknown> | null, key: string): string {
  const value = record?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function readChoice(
  record: Record<string, unknown> | null,
  key: string,
  matches: (value: string) => boolean,
): string {
  const value = readString(record, key);
  return matches(value) ? value : "";
}

function logProfileDiagnostic(step: string, error: { message: string; code?: string } | null) {
  if (process.env.NODE_ENV === "production" || !error) {
    return;
  }

  console.error(`[profile:${step}]`, {
    code: error.code ?? null,
    message: error.message,
  });
}
