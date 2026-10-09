import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  IconArrow,
  IconChart,
  IconCheckList,
  IconQuiz,
  IconSpark,
  IconTarget,
  IconTutor,
} from "@/features/app-shell/icons";
import { DashboardTodayTasks } from "@/features/dashboard/dashboard-today-tasks";
import type { ActivityItem, QuizTrendPoint } from "@/features/performance/types";
import type { DashboardMetric, DashboardView } from "@/services/dashboard";
import { cn } from "@/lib/cn";

type DashboardViewProps = {
  dashboard: DashboardView;
  signOutError?: string;
};

export function DashboardViewPanel({ dashboard, signOutError }: DashboardViewProps) {
  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <DashboardHeader dashboard={dashboard} signOutError={signOutError} />
      <CurrentGoalCard dashboard={dashboard} />

      {dashboard.metrics.length > 0 ? (
        <section aria-labelledby="progress-overview-heading">
          <div className="flex items-end justify-between gap-3">
            <h2 id="progress-overview-heading" className="section-heading">
              Progress overview
            </h2>
          </div>
          <div
            className={cn(
              "mt-4 grid gap-3",
              dashboard.metrics.length === 1 && "sm:grid-cols-1",
              dashboard.metrics.length === 2 && "sm:grid-cols-2",
              dashboard.metrics.length >= 3 && "sm:grid-cols-2 xl:grid-cols-3",
            )}
          >
            {dashboard.metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <TodaysLearningCard dashboard={dashboard} />
        <ContinueLearningCard dashboard={dashboard} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PerformancePreviewCard dashboard={dashboard} />
        <RecommendationCard dashboard={dashboard} />
      </div>

      <QuickActions />

      {dashboard.recentActivity.length > 0 ? (
        <RecentActivityCard items={dashboard.recentActivity} />
      ) : null}
    </div>
  );
}

function DashboardHeader({
  dashboard,
  signOutError,
}: {
  dashboard: DashboardView;
  signOutError?: string;
}) {
  return (
    <PageHeader
      eyebrow="Learning home"
      title={`${dashboard.greeting}, ${dashboard.firstName}`}
      description="Your personalized learning journey is moving forward."
    >
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Learning context">
        {dashboard.careerGoal ? <ContextChip label="Goal" value={dashboard.careerGoal} /> : null}
        {dashboard.stageTitle ? <ContextChip label="Stage" value={dashboard.stageTitle} /> : null}
        {dashboard.educationContext ? (
          <ContextChip label="Context" value={dashboard.educationContext} />
        ) : null}
        {!dashboard.careerGoal && !dashboard.stageTitle && !dashboard.educationContext ? (
          <ContextChip label="Status" value="Complete your profile to personalize this space" />
        ) : null}
      </ul>
      {signOutError ? (
        <p className="field-error mt-4" role="alert">
          Error: {signOutError}
        </p>
      ) : null}
    </PageHeader>
  );
}

function ContextChip({ label, value }: { label: string; value: string }) {
  return (
    <li className="max-w-full rounded-full border border-border bg-elevated px-3 py-1.5 text-xs text-foreground-soft">
      <span className="font-medium text-ink">{label}: </span>
      <span className="break-words">{value}</span>
    </li>
  );
}

function CurrentGoalCard({ dashboard }: { dashboard: DashboardView }) {
  if (!dashboard.careerGoal) {
    return (
      <section className="card card-elevated" aria-labelledby="current-goal-heading">
        <p className="eyebrow">Current goal</p>
        <h2 id="current-goal-heading" className="card-heading mt-2">
          Set your learning direction
        </h2>
        <p className="body-secondary mt-3">
          Add a career goal to unlock your roadmap, study plan, and personalized recommendations.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button href="/app/future-planner">Open Future Planner</Button>
          {dashboard.profileIncomplete ? (
            <Button href="/app/profile" variant="secondary">
              Complete profile
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  if (!dashboard.hasRoadmap) {
    return (
      <section className="card card-elevated" aria-labelledby="current-goal-heading">
        <p className="eyebrow">Current goal</p>
        <h2 id="current-goal-heading" className="card-heading mt-2">
          {dashboard.careerGoal}
        </h2>
        <p className="body-secondary mt-3">Your learning roadmap is ready to begin.</p>
        {dashboard.targetOutcome ? (
          <p className="body mt-2">
            <span className="caption">Target outcome</span>
            <span className="mt-1 block">{dashboard.targetOutcome}</span>
          </p>
        ) : null}
        <div className="mt-5">
          <Button href="/app/future-planner">Create My Roadmap</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="card surface-goal-premium" aria-labelledby="current-goal-heading">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Current goal</p>
          <h2 id="current-goal-heading" className="card-heading mt-2">
            {dashboard.careerGoal}
          </h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="caption">Target outcome</dt>
              <dd className="body mt-1">{dashboard.targetOutcome ?? "Not set yet"}</dd>
            </div>
            <div>
              <dt className="caption">Current stage</dt>
              <dd className="body mt-1">{dashboard.stageTitle ?? "Not started yet"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="caption">Next milestone</dt>
              <dd className="body mt-1">{dashboard.nextMilestone ?? "Define the next milestone in your plan"}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <Button href={dashboard.continueHref}>{dashboard.continueLabel}</Button>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col justify-center rounded-2xl border border-border bg-soft-gold px-5 py-5 lg:w-52">
          <p className="caption">Roadmap progress</p>
          <p
            className="mt-2 text-4xl font-medium text-ink"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {dashboard.roadmapProgress !== null ? `${dashboard.roadmapProgress}%` : "—"}
          </p>
          {dashboard.roadmapProgress !== null ? (
            <div
              className="progress-track mt-4 h-2"
              role="progressbar"
              aria-label="Roadmap progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={dashboard.roadmapProgress}
            >
              <div
                className="progress-fill-gold h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, dashboard.roadmapProgress))}%` }}
              />
            </div>
          ) : (
            <p className="caption mt-3">Progress appears after study activity</p>
          )}
        </div>
      </div>
    </section>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const well = metricWellClass(metric.id);

  return (
    <article className="card card-elevated">
      <div className="flex items-start justify-between gap-3">
        <p className="caption">{metric.label}</p>
        <span className={cn("icon-well", well)} aria-hidden="true">
          <MetricIcon id={metric.id} />
        </span>
      </div>
      <p
        className="mt-3 text-3xl font-medium text-ink"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        {metric.value}
      </p>
      <p className="body-secondary mt-2">{metric.hint}</p>
    </article>
  );
}

function metricWellClass(id: DashboardMetric["id"]): string {
  switch (id) {
    case "overall":
      return "icon-well-purple";
    case "tasks":
      return "icon-well-emerald";
    case "quiz":
    case "quizzes-count":
      return "icon-well-blue";
    default:
      return "icon-well-teal";
  }
}

function MetricIcon({ id }: { id: DashboardMetric["id"] }) {
  switch (id) {
    case "overall":
      return <IconChart className="size-4" />;
    case "tasks":
      return <IconCheckList className="size-4" />;
    case "quiz":
    case "quizzes-count":
      return <IconQuiz className="size-4" />;
    default:
      return <IconTarget className="size-4" />;
  }
}

function TodaysLearningCard({ dashboard }: { dashboard: DashboardView }) {
  const hasTasks = dashboard.todayTotal > 0;
  const percent =
    dashboard.todayTotal > 0
      ? Math.round((dashboard.todayCompleted / dashboard.todayTotal) * 100)
      : 0;

  return (
    <section className="card card-raised" aria-labelledby="todays-learning-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 id="todays-learning-heading" className="card-heading">
            Today&apos;s Learning
          </h2>
          <p className="caption mt-1">
            {hasTasks
              ? `${dashboard.todayCompleted} of ${dashboard.todayTotal} tasks completed`
              : "No learning tasks scheduled for today."}
          </p>
        </div>
        <Button
          href={hasTasks || dashboard.hasStudyPlan ? "/app/daily-tasks" : "/app/study-plan"}
          variant="secondary"
          className="shrink-0"
        >
          {hasTasks || dashboard.hasStudyPlan ? "View All Tasks" : "Open Study Plan"}
        </Button>
      </div>

      {hasTasks ? (
        <>
          <div className="mt-4">
            <div
              className="progress-track h-2"
              role="progressbar"
              aria-label="Today's learning progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div className="progress-fill-emerald h-full rounded-full" style={{ width: `${percent}%` }} />
            </div>
            <p className="caption mt-2">
              {percent}% complete
              {dashboard.todayMinutesRemaining > 0
                ? ` · ${dashboard.todayMinutesRemaining} min remaining`
                : ""}
            </p>
          </div>
          <DashboardTodayTasks tasks={dashboard.todayTasks} />
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-paper-raised px-4 py-5">
          <p className="body-secondary">
            {dashboard.hasStudyPlan
              ? "Nothing is due today. Check your study plan for upcoming work."
              : "Your personalized study plan will appear here once your roadmap is ready."}
          </p>
          <div className="mt-4">
            <Button href={dashboard.hasRoadmap ? "/app/study-plan" : "/app/future-planner"} variant="secondary">
              {dashboard.hasRoadmap ? "Open Study Plan" : "Create My Roadmap"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function ContinueLearningCard({ dashboard }: { dashboard: DashboardView }) {
  return (
    <section className="card card-raised" aria-labelledby="continue-learning-heading">
      <h2 id="continue-learning-heading" className="card-heading">
        Continue Learning
      </h2>
      <dl className="mt-4 grid gap-3">
        <div>
          <dt className="caption">Current subject</dt>
          <dd className="body mt-1">{dashboard.continueSubject ?? "Not available yet"}</dd>
        </div>
        <div>
          <dt className="caption">Current milestone</dt>
          <dd className="body mt-1">{dashboard.continueMilestone ?? "Not available yet"}</dd>
        </div>
        <div>
          <dt className="caption">Next task</dt>
          <dd className="body mt-1">{dashboard.continueNextTask ?? dashboard.continueAction}</dd>
        </div>
      </dl>
      {(dashboard.continueProgress !== null || dashboard.continueMinutes !== null) && (
        <p className="caption mt-4">
          {[
            dashboard.continueProgress !== null ? `${dashboard.continueProgress}% progress` : null,
            dashboard.continueMinutes !== null ? `${dashboard.continueMinutes} min next` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      <div className="mt-5">
        <Button href={dashboard.continueHref}>{dashboard.continueLabel}</Button>
      </div>
    </section>
  );
}

function PerformancePreviewCard({ dashboard }: { dashboard: DashboardView }) {
  const hasData =
    dashboard.averageQuizScore !== null ||
    dashboard.quizzesCompleted > 0 ||
    dashboard.tasksCompleted > 0 ||
    dashboard.strongArea !== null ||
    dashboard.weakArea !== null ||
    dashboard.quizTrend.length > 0;

  return (
    <section className="card card-raised" aria-labelledby="performance-preview-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 id="performance-preview-heading" className="card-heading">
          Performance snapshot
        </h2>
        <Button href="/app/performance" variant="secondary" className="shrink-0">
          View Performance
        </Button>
      </div>

      {hasData ? (
        <>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {dashboard.averageQuizScore !== null ? (
              <div>
                <dt className="caption">Average quiz score</dt>
                <dd className="body mt-1">{dashboard.averageQuizScore}%</dd>
              </div>
            ) : null}
            {dashboard.quizzesCompleted > 0 ? (
              <div>
                <dt className="caption">Quizzes completed</dt>
                <dd className="body mt-1">{dashboard.quizzesCompleted}</dd>
              </div>
            ) : null}
            {dashboard.tasksTotal > 0 ? (
              <div>
                <dt className="caption">Tasks completed</dt>
                <dd className="body mt-1">
                  {dashboard.tasksCompleted}/{dashboard.tasksTotal}
                </dd>
              </div>
            ) : null}
            {dashboard.strongArea ? (
              <div>
                <dt className="caption">Strong area</dt>
                <dd className="body mt-1">{dashboard.strongArea}</dd>
              </div>
            ) : null}
            {dashboard.weakArea ? (
              <div>
                <dt className="caption">Focus area</dt>
                <dd className="body mt-1">{dashboard.weakArea}</dd>
              </div>
            ) : null}
          </dl>
          {dashboard.quizTrend.length > 0 ? <MiniQuizTrend points={dashboard.quizTrend} /> : null}
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-paper-raised px-4 py-5">
          <p className="body-secondary">
            Complete your first quiz to start tracking your performance.
          </p>
          <div className="mt-4">
            <Button href="/app/quiz" variant="secondary">
              Take AI Quiz
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function MiniQuizTrend({ points }: { points: QuizTrendPoint[] }) {
  return (
    <div className="mt-5">
      <p className="caption">Recent quiz scores</p>
      <div
        className="mt-3 flex h-28 items-end gap-2"
        role="img"
        aria-label="Recent quiz score trend"
      >
        {points.map((point) => (
          <div key={point.id} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1.5">
            <p className="caption text-center">{point.score}%</p>
            <div className="flex min-h-10 flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-blue"
                style={{ height: `${Math.max(point.score, 6)}%` }}
                title={`${point.title}: ${point.score}%`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({ dashboard }: { dashboard: DashboardView }) {
  const hasRecommendation = Boolean(dashboard.recommendation);

  return (
    <section className="card card-elevated" aria-labelledby="recommended-heading">
      <div className="flex items-start gap-3">
        <span className="icon-well icon-well-teal mt-0.5 size-10" aria-hidden="true">
          <IconSpark className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Your personalized recommendation</p>
          <h2 id="recommended-heading" className="card-heading mt-2">
            {dashboard.recommendationTitle ?? "Recommendations unlock with activity"}
          </h2>
          {hasRecommendation ? (
            <>
              <p className="body mt-3">{dashboard.recommendation}</p>
              {dashboard.recommendationWhy ? (
                <p className="body-secondary mt-3">
                  <span className="font-medium text-ink">Why: </span>
                  {dashboard.recommendationWhy}
                </p>
              ) : null}
              {dashboard.recommendationNextStep ? (
                <p className="body-secondary mt-2">
                  <span className="font-medium text-ink">Next step: </span>
                  {dashboard.recommendationNextStep}
                </p>
              ) : null}
              <div className="mt-5">
                <Button href={dashboard.recommendationHref}>View Recommendation</Button>
              </div>
            </>
          ) : (
            <div className="mt-3">
              <p className="body-secondary">
                Complete more learning activities to receive personalized recommendations.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button href="/app/personalization" variant="secondary">
                  Open Personalization
                </Button>
                <Button href="/app/quiz" variant="secondary">
                  Take AI Quiz
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function QuickActions() {
  const actions = [
    {
      href: "/app/daily-tasks",
      label: "Continue Study",
      detail: "Today's tasks",
      icon: IconCheckList,
      well: "icon-well-emerald",
    },
    {
      href: "/app/quiz",
      label: "Take AI Quiz",
      detail: "Check understanding",
      icon: IconQuiz,
      well: "icon-well-blue",
    },
    {
      href: "/app/ai-tutor",
      label: "Ask AI Tutor",
      detail: "Get guided help",
      icon: IconTutor,
      well: "icon-well-purple",
    },
    {
      href: "/app/future-planner",
      label: "View Roadmap",
      detail: "Career stages",
      icon: IconTarget,
      well: "icon-well-gold",
    },
  ] as const;

  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="section-heading">
        Quick actions
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.href}>
              <Link
                href={action.href}
                className="card card-elevated flex h-full items-start gap-3 transition hover:border-purple/40"
              >
                <span className={cn("icon-well size-10", action.well)} aria-hidden="true">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{action.label}</span>
                  <span className="caption mt-1 block">{action.detail}</span>
                </span>
                <IconArrow className="mt-1 size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="caption mt-3">
        Also available:{" "}
        <Link href="/app/study-plan" className="underline underline-offset-2">
          Study Plan
        </Link>
        {" · "}
        <Link href="/app/adaptive-plan" className="underline underline-offset-2">
          Adaptive Plan
        </Link>
        {" · "}
        <Link href="/app/performance" className="underline underline-offset-2">
          Performance
        </Link>
        {" · "}
        <Link href="/app/personalization" className="underline underline-offset-2">
          Personalization
        </Link>
      </p>
    </section>
  );
}

function RecentActivityCard({ items }: { items: ActivityItem[] }) {
  return (
    <section className="card card-quiet" aria-labelledby="recent-activity-heading">
      <div className="flex items-start justify-between gap-3">
        <h2 id="recent-activity-heading" className="card-heading">
          Recent activity
        </h2>
        <Button href="/app/performance" variant="secondary" className="shrink-0">
          Full history
        </Button>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
            <p className="caption">{formatActivityWhen(item.at)}</p>
            <p className="body mt-1">{item.title}</p>
            <p className="caption mt-1">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatActivityWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
