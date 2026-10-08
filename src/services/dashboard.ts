import "server-only";

import {
  EDUCATION_LEVELS,
  SKILL_LEVELS,
} from "@/features/onboarding/options";
import type {
  ActivityItem,
  PerformanceDashboard,
  QuizTrendPoint,
} from "@/features/performance/types";
import { taskGroup } from "@/features/study-plan/schedule";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { loadDailyTasks, type DailyTasksLoad } from "@/services/daily-tasks";
import { loadPerformancePage } from "@/services/performance";
import { loadPersonalizationPage } from "@/services/personalization";
import { loadProfile } from "@/services/profile";

export type DashboardMetric = {
  id: "overall" | "tasks" | "quiz" | "quizzes-count";
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
  milestoneTitle: string;
};

export type DashboardView = {
  greeting: string;
  firstName: string;
  email: string;
  careerGoal: string | null;
  targetOutcome: string | null;
  stageTitle: string | null;
  nextMilestone: string | null;
  educationContext: string | null;
  roadmapProgress: number | null;
  profileIncomplete: boolean;
  hasRoadmap: boolean;
  hasStudyPlan: boolean;
  metrics: DashboardMetric[];
  todayTasks: DashboardTaskPreview[];
  todayCompleted: number;
  todayTotal: number;
  todayPending: number;
  todayMinutesRemaining: number;
  continueHref: string;
  continueLabel: string;
  continueSubject: string | null;
  continueStage: string | null;
  continueMilestone: string | null;
  continueNextTask: string | null;
  continueAction: string;
  continueProgress: number | null;
  continueMinutes: number | null;
  averageQuizScore: number | null;
  quizzesCompleted: number;
  tasksCompleted: number;
  tasksTotal: number;
  recentQuizTitle: string | null;
  recentQuizScore: number | null;
  strongArea: string | null;
  weakArea: string | null;
  quizTrend: QuizTrendPoint[];
  recommendationTitle: string | null;
  recommendation: string | null;
  recommendationWhy: string | null;
  recommendationNextStep: string | null;
  recommendationHref: string;
  recentActivity: ActivityItem[];
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

  const performance = performanceLoad.status === "ready" ? performanceLoad.dashboard : null;

  const careerGoal = profile.careerGoal.trim() || null;
  const targetOutcome = profile.targetOutcome.trim() || null;
  const educationContext = buildEducationContext(profile.educationLevel, profile.fieldOfStudy, profile.skillLevel);

  const hasRoadmap =
    dailyLoad.status === "ready" ||
    (performanceLoad.status === "empty" && performanceLoad.hasRoadmap) ||
    (performanceLoad.status === "ready" && Boolean(performance?.currentRoadmapTitle));

  const hasStudyPlan =
    dailyLoad.status === "ready" ||
    (performanceLoad.status === "empty" && performanceLoad.hasPlan) ||
    (performanceLoad.status === "ready" && Boolean(performance?.currentPlanTitle));

  const stageTitle =
    performance?.currentStageTitle?.trim() ||
    (dailyLoad.status === "ready" ? nonempty(dailyLoad.day.stageTitle) : null);

  const nextMilestone =
    dailyLoad.status === "ready"
      ? nonempty(dailyLoad.day.stageMilestone)
      : performance?.currentPlanTitle?.trim() || null;

  const roadmapProgress =
    performance?.currentPercent !== null && performance?.currentPercent !== undefined
      ? performance.currentPercent
      : performance?.overallPercent !== undefined
        ? performance.overallPercent
        : null;

  const profileIncomplete = !careerGoal || !targetOutcome;
  const metrics = buildMetrics(performance, dailyLoad);

  let todayTasks: DashboardTaskPreview[] = [];
  let todayCompleted = 0;
  let todayTotal = 0;
  let todayPending = 0;
  let todayMinutesRemaining = 0;
  let continueNextTask: string | null = null;
  let continueSubject: string | null = null;
  let continueMinutes: number | null = null;

  if (dailyLoad.status === "ready") {
    const today = dailyLoad.day.today;
    const dueNow = dailyLoad.day.tasks.filter((task) => taskGroup(task, today) === "today");
    const completedToday = dailyLoad.day.tasks.filter(
      (task) => task.status === "completed" && task.scheduledOn === today,
    );
    todayCompleted = completedToday.length;
    todayPending = dueNow.length;
    todayTotal = dueNow.length + completedToday.length;
    todayMinutesRemaining = dueNow.reduce((sum, task) => sum + task.durationMinutes, 0);
    todayTasks = [...dueNow, ...completedToday].slice(0, 5).map((task) => ({
      id: task.id,
      title: task.title,
      skill: task.skill,
      status: task.status,
      durationMinutes: task.durationMinutes,
      milestoneTitle: task.milestoneTitle,
    }));

    const nextPending = dueNow[0] ?? dailyLoad.day.tasks.find((task) => task.status === "pending") ?? null;
    if (nextPending) {
      continueNextTask = nextPending.title;
      continueSubject = nextPending.skill || dailyLoad.day.subjects[0] || null;
      continueMinutes = nextPending.durationMinutes;
    } else if (dailyLoad.day.subjects[0]) {
      continueSubject = dailyLoad.day.subjects[0];
    }
  }

  const continueHref = resolveContinueHref({
    hasGoal: Boolean(careerGoal),
    hasRoadmap,
    hasPendingTasks: todayPending > 0,
    hasPlan: hasStudyPlan,
    personalizationReady: personalizationLoad.status === "ready",
  });

  const continueStage =
    stageTitle || (performance?.currentRoadmapTitle ? performance.currentRoadmapTitle : null);

  const continueMilestone =
    nextMilestone ||
    (dailyLoad.status === "ready" ? nonempty(dailyLoad.day.stageMilestone) : null) ||
    performance?.currentPlanTitle ||
    null;

  const recommendationBundle = resolveRecommendation({
    personalizationLoad,
    todayPending,
    weakArea: performance?.weakAreas[0]?.skill ?? null,
    careerGoal,
    stageTitle,
    hasRoadmap,
  });

  const continueAction = resolveContinueAction({
    href: continueHref,
    pendingTasks: todayPending,
    recommendation: recommendationBundle.nextStep || recommendationBundle.summary,
  });

  const continueProgress =
    todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : roadmapProgress;

  const recentQuiz = performance?.recentQuizzes[0] ?? null;

  return {
    status: "ready",
    dashboard: {
      greeting,
      firstName: first,
      email: profile.email,
      careerGoal,
      targetOutcome,
      stageTitle,
      nextMilestone,
      educationContext,
      roadmapProgress,
      profileIncomplete,
      hasRoadmap,
      hasStudyPlan,
      metrics,
      todayTasks,
      todayCompleted,
      todayTotal,
      todayPending,
      todayMinutesRemaining,
      continueHref,
      continueLabel: continueLabelForHref(continueHref),
      continueSubject,
      continueStage,
      continueMilestone,
      continueNextTask,
      continueAction,
      continueProgress,
      continueMinutes,
      averageQuizScore: performance?.averageQuizScore ?? null,
      quizzesCompleted: performance?.quizzesCompleted ?? 0,
      tasksCompleted: performance?.tasksCompleted ?? 0,
      tasksTotal: performance?.tasksTotal ?? 0,
      recentQuizTitle: recentQuiz?.title ?? null,
      recentQuizScore: recentQuiz?.score ?? null,
      strongArea: performance?.strongAreas[0]?.skill ?? null,
      weakArea: performance?.weakAreas[0]?.skill ?? null,
      quizTrend: performance?.quizTrend.slice(-6) ?? [],
      recommendationTitle: recommendationBundle.title,
      recommendation: recommendationBundle.summary,
      recommendationWhy: recommendationBundle.why,
      recommendationNextStep: recommendationBundle.nextStep,
      recommendationHref: recommendationBundle.href,
      recentActivity: performance?.recentActivity.slice(0, 5) ?? [],
    },
  };
}

function buildMetrics(
  performance: PerformanceDashboard | null,
  dailyLoad: DailyTasksLoad,
): DashboardMetric[] {
  const metrics: DashboardMetric[] = [];

  if (performance) {
    metrics.push({
      id: "overall",
      label: "Overall Progress",
      value: `${performance.overallPercent}%`,
      hint: "From your saved plan activity and quiz scores",
    });

    metrics.push({
      id: "tasks",
      label: "Tasks Completed",
      value: `${performance.tasksCompleted}/${performance.tasksTotal}`,
      hint:
        performance.taskPercent !== null
          ? `${performance.taskPercent}% of your current study tasks`
          : "From your study plan",
    });

    if (performance.averageQuizScore !== null) {
      metrics.push({
        id: "quiz",
        label: "Quiz Average",
        value: `${performance.averageQuizScore}%`,
        hint: `${performance.quizzesCompleted} quiz${performance.quizzesCompleted === 1 ? "" : "zes"} recorded`,
      });
    } else if (performance.quizzesCompleted > 0) {
      metrics.push({
        id: "quizzes-count",
        label: "Quizzes Completed",
        value: String(performance.quizzesCompleted),
        hint: "Submitted attempts on your account",
      });
    }

    return metrics;
  }

  if (dailyLoad.status === "ready" && dailyLoad.day.dayTotal > 0) {
    metrics.push({
      id: "tasks",
      label: "Today's Tasks",
      value: `${dailyLoad.day.dayCompleted}/${dailyLoad.day.dayTotal}`,
      hint: "Completed versus scheduled for today",
    });
  }

  return metrics;
}

function buildEducationContext(
  educationLevel: string,
  fieldOfStudy: string,
  skillLevel: string,
): string | null {
  const education =
    EDUCATION_LEVELS.find((option) => option.value === educationLevel)?.label ?? null;
  const skill = SKILL_LEVELS.find((option) => option.value === skillLevel)?.label ?? null;
  const field = fieldOfStudy.trim() || null;

  const parts = [education, field, skill].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function resolveRecommendation(input: {
  personalizationLoad: Awaited<ReturnType<typeof loadPersonalizationPage>>;
  todayPending: number;
  weakArea: string | null;
  careerGoal: string | null;
  stageTitle: string | null;
  hasRoadmap: boolean;
}): {
  title: string | null;
  summary: string | null;
  why: string | null;
  nextStep: string | null;
  href: string;
} {
  if (input.personalizationLoad.status === "ready") {
    const open = input.personalizationLoad.result.recommendations.find((item) => item.status === "open");
    const summary =
      open?.summary?.trim() ||
      input.personalizationLoad.result.recommendedNextStep.trim() ||
      input.personalizationLoad.result.currentFocus.trim() ||
      null;
    const why =
      open?.reasoning?.trim() ||
      input.personalizationLoad.result.reasoning[0]?.trim() ||
      null;
    const nextStep =
      input.personalizationLoad.result.recommendedNextStep.trim() ||
      open?.title?.trim() ||
      null;

    return {
      title: open?.title?.trim() || input.personalizationLoad.result.currentFocus.trim() || "Personalized focus",
      summary,
      why,
      nextStep,
      href: hrefForRecommendationKind(open?.kind),
    };
  }

  if (input.todayPending > 0) {
    return {
      title: "Stay on today's plan",
      summary: `Complete today's pending practice task${input.todayPending === 1 ? "" : "s"}.`,
      why: "Your study plan still has open work scheduled for today.",
      nextStep: "Open Daily Tasks and finish the next item.",
      href: "/app/daily-tasks",
    };
  }

  if (input.weakArea) {
    return {
      title: `Strengthen ${input.weakArea}`,
      summary: `Review ${input.weakArea} before moving to the next topic.`,
      why: "Recent quiz answers show this skill needs more practice.",
      nextStep: "Open Adaptive Plan for a guided update.",
      href: "/app/adaptive-plan",
    };
  }

  if (input.careerGoal && !input.hasRoadmap) {
    return {
      title: "Start your roadmap",
      summary: "Generate your learning roadmap to define the next skill stages.",
      why: "A career goal is set, but no roadmap stages are saved yet.",
      nextStep: "Open Future Planner and create your roadmap.",
      href: "/app/future-planner",
    };
  }

  if (input.careerGoal && !input.stageTitle) {
    return {
      title: "Define the next stage",
      summary: "Open your roadmap to confirm the current stage and milestone.",
      why: null,
      nextStep: "Continue in Future Planner.",
      href: "/app/future-planner",
    };
  }

  return {
    title: null,
    summary: null,
    why: null,
    nextStep: null,
    href: "/app/personalization",
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

function nonempty(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.toLowerCase().startsWith("generate a roadmap")) {
    return null;
  }
  if (trimmed.toLowerCase() === "no stage yet") {
    return null;
  }
  return trimmed;
}

function resolveContinueHref(input: {
  hasGoal: boolean;
  hasRoadmap: boolean;
  hasPendingTasks: boolean;
  hasPlan: boolean;
  personalizationReady: boolean;
}): string {
  if (!input.hasGoal) {
    return "/app/future-planner";
  }
  if (!input.hasRoadmap) {
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
      return "View Recommendation";
    case "/app/future-planner":
      return "Create My Roadmap";
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
