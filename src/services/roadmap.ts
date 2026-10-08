import "server-only";

import { logServerDiagnostic } from "@/lib/security/log";
import {
  isLearningStyle,
  isSkillLevel,
  isWeeklyStudyTime,
  EDUCATION_LEVELS,
} from "@/features/onboarding/options";
import {
  decodeMilestoneDescription,
  decodeRoadmapSummary,
  encodeMilestoneDescription,
  encodeRoadmapSummary,
} from "@/features/roadmap/record";
import type { RoadmapLearnerInput, SavedRoadmap } from "@/features/roadmap/types";
import { validateRoadmapDraft } from "@/features/roadmap/validation";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { createRoadmapGenerator } from "@/services/roadmap-generator";

export type RoadmapLoad =
  | { status: "unauthenticated" }
  | { status: "empty" }
  | { status: "unavailable" }
  | { status: "ready"; roadmap: SavedRoadmap };

export type RoadmapGenerateResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "missing-goal" | "invalid" | "failed" };

export async function loadCurrentRoadmap(): Promise<RoadmapLoad> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const roadmapResult = await supabase
    .from("roadmaps")
    .select("id, title, summary")
    .eq("user_id", user.id)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roadmapResult.error) {
    logRoadmapDiagnostic("load-roadmap", roadmapResult.error);
    return { status: "unavailable" };
  }

  const roadmap = asRecord(roadmapResult.data);
  const roadmapId = readString(roadmap, "id");

  if (!roadmapId) {
    return { status: "empty" };
  }

  const milestoneResult = await supabase
    .from("roadmap_milestones")
    .select("position, title, description")
    .eq("user_id", user.id)
    .eq("roadmap_id", roadmapId)
    .order("position", { ascending: true });

  if (milestoneResult.error) {
    logRoadmapDiagnostic("load-milestones", milestoneResult.error);
    return { status: "unavailable" };
  }

  const summary = decodeRoadmapSummary(readString(roadmap, "summary"));
  const stages = (milestoneResult.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const title = readString(record, "title");

    if (!title) {
      return [];
    }

    const decoded = decodeMilestoneDescription(readString(record, "description"));
    return [{ title, skills: decoded.skills, milestone: decoded.milestone }];
  });

  return {
    status: "ready",
    roadmap: {
      id: roadmapId,
      title: readString(roadmap, "title"),
      overview: summary.overview,
      timeline: summary.timeline,
      nextSteps: summary.nextSteps,
      stages,
    },
  };
}

export async function generateAndSaveRoadmap(userId: string): Promise<RoadmapGenerateResult> {
  const user = await getAuthenticatedUser();

  if (!user || user.id !== userId) {
    return { ok: false, reason: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const context = await loadLearnerContext(user.id);

  if (!context.ok) {
    return { ok: false, reason: context.reason };
  }

  const draft = await createRoadmapGenerator().generate(context.input);
  const invalid = validateRoadmapDraft(draft);

  if (invalid) {
    logRoadmapDiagnostic("validate-draft", { message: invalid });
    return { ok: false, reason: "invalid" };
  }

  const superseded = await supabase
    .from("roadmaps")
    .update({ is_current: false, status: "superseded" })
    .eq("user_id", user.id)
    .eq("goal_id", context.goalId)
    .eq("is_current", true);

  if (superseded.error) {
    logRoadmapDiagnostic("supersede-roadmap", superseded.error);
    return { ok: false, reason: "failed" };
  }

  const inserted = await supabase
    .from("roadmaps")
    .insert({
      user_id: user.id,
      goal_id: context.goalId,
      title: draft.title,
      summary: encodeRoadmapSummary(draft),
      status: "ready",
      is_current: true,
    })
    .select("id")
    .maybeSingle();

  if (inserted.error || !inserted.data) {
    logRoadmapDiagnostic("insert-roadmap", inserted.error);
    return { ok: false, reason: "failed" };
  }

  const roadmapId = readString(asRecord(inserted.data), "id");

  if (!roadmapId) {
    return { ok: false, reason: "failed" };
  }

  const milestones = await supabase.from("roadmap_milestones").insert(
    draft.stages.map((stage, index) => ({
      user_id: user.id,
      roadmap_id: roadmapId,
      position: index + 1,
      title: stage.title,
      description: encodeMilestoneDescription(stage),
    })),
  );

  if (milestones.error) {
    logRoadmapDiagnostic("insert-milestones", milestones.error);
    await supabase.from("roadmaps").delete().eq("id", roadmapId).eq("user_id", user.id);
    return { ok: false, reason: "failed" };
  }

  return { ok: true };
}

async function loadLearnerContext(userId: string): Promise<
  | { ok: true; goalId: string; input: RoadmapLearnerInput }
  | { ok: false; reason: "missing-goal" | "failed" }
> {
  const supabase = await createSupabaseServerClient();
  const profileResult = await supabase
    .from("profiles")
    .select("education_level, field_of_study, skill_level, weekly_study_time, learning_style")
    .eq("id", userId)
    .maybeSingle();

  if (profileResult.error) {
    logRoadmapDiagnostic("load-profile", profileResult.error);
    return { ok: false, reason: "failed" };
  }

  const goalResult = await supabase
    .from("goals")
    .select("id, title, description")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (goalResult.error) {
    logRoadmapDiagnostic("load-goal", goalResult.error);
    return { ok: false, reason: "failed" };
  }

  const profile = asRecord(profileResult.data);
  const goal = asRecord(goalResult.data);
  const goalId = readString(goal, "id");
  const careerGoal = readString(goal, "title");

  if (!goalId || !careerGoal) {
    return { ok: false, reason: "missing-goal" };
  }

  const skill = readString(profile, "skill_level");
  const weekly = readString(profile, "weekly_study_time");
  const style = readString(profile, "learning_style");
  const education = readString(profile, "education_level");

  return {
    ok: true,
    goalId,
    input: {
      careerGoal,
      targetOutcome: readString(goal, "description") || "Be able to use this skill in real work.",
      educationLevel: EDUCATION_LEVELS.find((option) => option.value === education)?.label ?? "Current",
      fieldOfStudy: readString(profile, "field_of_study") || "your field",
      skillLevel: isSkillLevel(skill) ? skill : "beginner",
      weeklyStudyTime: isWeeklyStudyTime(weekly) ? weekly : "5_to_10",
      learningStyle: isLearningStyle(style) ? style : "mixed",
    },
  };
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

function logRoadmapDiagnostic(step: string, error: { message: string; code?: string } | null) {
  logServerDiagnostic("roadmap", step, error);
}
