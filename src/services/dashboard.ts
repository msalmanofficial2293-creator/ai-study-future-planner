import "server-only";

import { taskGroup } from "@/features/study-plan/schedule";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { loadDailyTasks } from "@/services/daily-tasks";
import { loadPerformancePage } from "@/services/performance";
import { loadPersonalizationPage } from "@/services/personalization";
import { loadProfile } from "@/services/profile";

export type DashboardMetric = {
  label: string;
  value: string;
  hint: string;
};

export type DashboardTaskPreview = {
  id: string;
  title: string;
  skill: string;
  status: "pending" | "completed";
  durationMinutes: number;
};

export type DashboardView = {
  greeting: string;
  firstName: string;
  email: string;
  careerGoal: string | null;
  targetOutcome: string | null;
  stageTitle: string | null;
  roadmapProgress: number | null;
  profileIncomplete: boolean;
  metrics: DashboardMetric[];
  todayTasks: DashboardTaskPreview[];
  todayCompleted: number;
  todayTotal: number;
  todayPending: number;
  continueHref: string;
  continueLabel: string;
  continueStage: string | null;
  continueMilestone: string | null;
  continueAction: string;
  continueProgress: number | null;
  averageQuizScore: number | null;
  recentQuizTitle: string | null;
  recentQuizScore: number | null;
  strongArea: string | null;
  weakArea: string | null;
  recommendation: string | null;
  recommendationHref: string;
};

export type DashboardLoad =
  | { status: "unauthenticated" }
  | { status: "unavailable" }
  | { status: "ready"; dashboard: DashboardView };

export async function loadDashboard(): Promise<DashboardLoad> {
  const user = await getAuthenticatedUser();

  if (!user?.email) {
    return { status: "unauthenticated" };
  }

  const [profileLoad, performanceLoad, dailyLoad, personalizationLoad] = await Promise.all([
    loadProfile(),
    loadPerformancePage(),
    loadDailyTasks(),
    loadPersonalizationPage(),
  ]);

  if (profileLoad.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (profileLoad.status === "unavailable" || profileLoad.status === "missing") {
    return { status: "unavailable" };
  }

  const profile = profileLoad.profile;
  const first = firstName(profile.fullName);
  const greeting = timeGreeting();

  const performance =
    performanceLoad.status === "ready"
      ? performanceLoad.dashboard
      : null;

  const careerGoal = profile.careerGoal.trim() || null;
  const targetOutcome = profile.targetOutcome.trim() || null;
  const stageTitle =
    performance?.currentStageTitle?.trim() ||
    (dailyLoad.status === "ready" ? dailyLoad.day.stageTitle.trim() || null : null);

  const roadmapProgress =
    performance?.currentPercent !== null && performance?.currentPercent !== undefined
      ? performance.currentPercent
      : performance?.overallPercent !== undefined
        ? performance.overallPercent
        : null;

  const profileIncomplete = !careerGoal || !targetOutcome;

  const metrics: DashboardMetric[] = [];

  if (performance) {
    metrics.push({
      label: "Overall Progress",
      value: `${performance.overallPercent}%`,
      hint: "Based on your current plan and saved activity",
    });

    metrics.push({
      label: "Study Tasks",
      value: `${performance.tasksCompleted}/${performance.tasksTotal}`,
      hint: performance.taskPercent !== null ? `${performance.taskPercent}% complete` : "From your study plan",
    });

    if (performance.averageQuizScore !== null) {
      metrics.push({
        label: "Quiz Average",
        value: `${performance.averageQuizScore}%`,
        hint: `${performance.quizzesCompleted} quiz${performance.quizzesCompleted === 1 ? "" : "zes"} recorded`,
      });
    }
  } else if (dailyLoad.status === "ready") {
    metrics.push({
      label: "Study Tasks",
      value: `${dailyLoad.day.dayCompleted}/${dailyLoad.day.dayTotal}`,
      hint: "Today's task progress",
    });
  }

  let todayTasks: DashboardTaskPreview[] = [];
  let todayCompleted = 0;
  let todayTotal = 0;
  let todayPending = 0;

  if (dailyLoad.status === "ready") {
    const today = dailyLoad.day.today;
    const dueNow = dailyLoad.day.tasks.filter((task) => taskGroup(task, today) === "today");
    const completedToday = dailyLoad.day.tasks.filter(
      (task) => task.status === "completed" && task.scheduledOn === today,
    );
    todayCompleted = completedToday.length;
    todayPending = dueNow.length;
    todayTotal = dueNow.length + completedToday.length;
    todayTasks = [...dueNow, ...completedToday].slice(0, 5).map((task) => ({
      id: task.id,
      title: task.title,
      skill: task.skill,
      status: task.status,
      durationMinutes: task.durationMinutes,
    }));
  }

  const continueHref = resolveContinueHref({
    hasGoal: Boolean(careerGoal),
    hasPendingTasks: todayPending > 0,
    hasPlan: dailyLoad.status === "ready" || performanceLoad.status === "ready" || performanceLoad.status === "empty",
    personalizationReady: personalizationLoad.status === "ready",
  });

  const continueStage =
    stageTitle ||
    (performance?.currentRoadmapTitle ? performance.currentRoadmapTitle : null);

  const continueMilestone =
    dailyLoad.status === "ready"
      ? dailyLoad.day.stageMilestone.trim() || null
      : performance?.currentPlanTitle || null;

  const continueAction = resolveContinueAction({
    href: continueHref,
    pendingTasks: todayPending,
    recommendation:
      personalizationLoad.status === "ready"
        ? personalizationLoad.result.recommendedNextStep
        : null,
  });

  const continueProgress =
    todayTotal > 0
      ? Math.round((todayCompleted / todayTotal) * 100)
      : roadmapProgress;

  const recentQuiz = performance?.recentQuizzes[0] ?? null;
  const strongArea = performance?.strongAreas[0]?.skill ?? null;
  const weakArea = performance?.weakAreas[0]?.skill ?? null;

  let recommendation: string | null = null;
  let recommendationHref = "/app/personalization";

  if (personalizationLoad.status === "ready") {
    const open = personalizationLoad.result.recommendations.find((item) => item.status === "open");
    recommendation =
      open?.summary?.trim() ||
      personalizationLoad.result.recommendedNextStep.trim() ||
      personalizationLoad.result.currentFocus.trim() ||
      null;
    recommendationHref = hrefForRecommendationKind(open?.kind);
  } else if (todayPending > 0) {
    recommendation = `Complete today's pending practice task${todayPending === 1 ? "" : "s"}.`;
    recommendationHref = "/app/daily-tasks";
  } else if (weakArea) {
    recommendation = `Review ${weakArea} before moving to the next topic.`;
    recommendationHref = "/app/adaptive-plan";
  } else if (careerGoal && !stageTitle) {
    recommendation = "Generate or open your roadmap to define the next skill.";
    recommendationHref = "/app/future-planner";
  }

  return {
    status: "ready",
    dashboard: {
      greeting,
      firstName: first,
      email: profile.email,
      careerGoal,
      targetOutcome,
      stageTitle,
      roadmapProgress,
      profileIncomplete,
      metrics,
      todayTasks,
      todayCompleted,
      todayTotal,
      todayPending,
      continueHref,
      continueLabel: continueLabelForHref(continueHref),
      continueStage,
      continueMilestone,
      continueAction,
      continueProgress,
      averageQuizScore: performance?.averageQuizScore ?? null,
      recentQuizTitle: recentQuiz?.title ?? null,
      recentQuizScore: recentQuiz?.score ?? null,
      strongArea,
      weakArea,
      recommendation,
      recommendationHref,
    },
  };
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/).filter(Boolean)[0];
  return part || "there";
}

function resolveContinueHref(input: {
  hasGoal: boolean;
  hasPendingTasks: boolean;
  hasPlan: boolean;
  personalizationReady: boolean;
}): string {
  if (!input.hasGoal) {
    return "/app/future-planner";
  }
  if (input.hasPendingTasks) {
    return "/app/daily-tasks";
  }
  if (input.hasPlan) {
    return "/app/study-plan";
  }
  if (input.personalizationReady) {
    return "/app/personalization";
  }
  return "/app/future-planner";
}

function resolveContinueAction(input: {
  href: string;
  pendingTasks: number;
  recommendation: string | null;
}): string {
  if (input.recommendation) {
    return input.recommendation;
  }
  if (input.pendingTasks > 0) {
    return `Finish ${input.pendingTasks} pending task${input.pendingTasks === 1 ? "" : "s"} for today.`;
  }
  if (input.href === "/app/future-planner") {
    return "Set or refine your career goal to unlock the next roadmap stage.";
  }
  return "Open your study plan and keep building momentum.";
}

function continueLabelForHref(href: string): string {
  switch (href) {
    case "/app/daily-tasks":
      return "Continue Learning";
    case "/app/study-plan":
      return "Open Study Plan";
    case "/app/personalization":
      return "View Recommendations";
    default:
      return "Continue Learning";
  }
}

function hrefForRecommendationKind(kind: string | undefined): string {
  switch (kind) {
    case "quiz":
      return "/app/quiz";
    case "revision":
    case "review":
    case "weak_topic":
      return "/app/adaptive-plan";
    case "practice":
    case "new_concept":
    case "next_skill":
      return "/app/daily-tasks";
    default:
      return "/app/personalization";
  }
}
