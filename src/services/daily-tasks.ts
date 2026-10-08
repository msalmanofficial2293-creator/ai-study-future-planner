import "server-only";

import { taskGroup } from "@/features/study-plan/schedule";
import type { StudyPlanDashboard } from "@/features/study-plan/types";
import { logServerDiagnostic } from "@/lib/security/log";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { loadStudyPlan } from "@/services/study-plan";

export type DailyTasksView = StudyPlanDashboard & {
  planTitle: string;
  dayCompleted: number;
  dayTotal: number;
};

export type DailyTasksLoad =
  | { status: "unauthenticated" }
  | { status: "incomplete" }
  | { status: "unavailable" }
  | { status: "no-roadmap" }
  | { status: "ready"; day: DailyTasksView };

export async function loadDailyTasks(): Promise<DailyTasksLoad> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const [loaded, planTitle] = await Promise.all([
    loadStudyPlan(),
    readCurrentPlanTitle(user.id),
  ]);

  if (loaded.status !== "ready") {
    return loaded;
  }

  if (planTitle === "failed") {
    return { status: "unavailable" };
  }

  // Match the Daily Board: pending/overdue tasks in the "today" group, plus
  // tasks completed on today's calendar date (shown under Completed).
  const today = loaded.plan.today;
  const dueNow = loaded.plan.tasks.filter((task) => taskGroup(task, today) === "today");
  const completedToday = loaded.plan.tasks.filter(
    (task) => task.status === "completed" && task.scheduledOn === today,
  );

  return {
    status: "ready",
    day: {
      ...loaded.plan,
      planTitle,
      dayCompleted: completedToday.length,
      dayTotal: dueNow.length + completedToday.length,
    },
  };
}

async function readCurrentPlanTitle(userId: string): Promise<string | "failed"> {
  const supabase = await createSupabaseServerClient();
  const roadmapResult = await supabase
    .from("roadmaps")
    .select("id")
    .eq("user_id", userId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roadmapResult.error) {
    logDailyDiagnostic("load-roadmap", roadmapResult.error);
    return "failed";
  }

  const roadmapId = readString(asRecord(roadmapResult.data), "id");

  if (!roadmapId) {
    return "No study plan yet";
  }

  const planResult = await supabase
    .from("study_plans")
    .select("title")
    .eq("user_id", userId)
    .eq("roadmap_id", roadmapId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planResult.error) {
    logDailyDiagnostic("load-plan", planResult.error);
    return "failed";
  }

  return readString(asRecord(planResult.data), "title") || "No study plan yet";
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

function logDailyDiagnostic(step: string, error: { message: string; code?: string }) {
  logServerDiagnostic("daily-tasks", step, error);
}
