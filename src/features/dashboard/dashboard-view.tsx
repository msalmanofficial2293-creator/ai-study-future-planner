import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  IconAdaptive,
  IconArrow,
  IconCalendar,
  IconChart,
  IconCheckList,
  IconQuiz,
  IconSpark,
  IconTarget,
  IconTutor,
} from "@/features/app-shell/icons";
import type { DashboardView } from "@/services/dashboard";

type DashboardViewProps = {
  dashboard: DashboardView;
  signOutError?: string;
};

export function DashboardViewPanel({ dashboard, signOutError }: DashboardViewProps) {
  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-3xl">
        <h1 className="page-heading">
          {dashboard.greeting}, {dashboard.firstName}
        </h1>
        <p className="body-secondary mt-3">
          Here&apos;s your learning overview and what to focus on next.
        </p>
        {signOutError ? (
          <p className="field-error mt-4" role="alert">
            Error: {signOutError}
          </p>
        ) : null}
      </header>

      <CurrentGoalCard dashboard={dashboard} />

      {dashboard.metrics.length > 0 ? (
        <section aria-labelledby="progress-overview-heading">
          <h2 id="progress-overview-heading" className="section-heading">
            Progress overview
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dashboard.metrics.map((metric) => (
              <article key={metric.label} className="card card-raised">
                <p className="caption">{metric.label}</p>
                <p className="mt-2 text-3xl font-medium text-ink" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                  {metric.value}
                </p>
                <p className="body-secondary mt-2">{metric.hint}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <TodaysLearningCard dashboard={dashboard} />
        <ContinueLearningCard dashboard={dashboard} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PerformancePreviewCard dashboard={dashboard} />
        <RecommendationCard dashboard={dashboard} />
      </div>

      <QuickActions />
    </div>
  );
}

function CurrentGoalCard({ dashboard }: { dashboard: DashboardView }) {
  if (dashboard.profileIncomplete && !dashboard.careerGoal) {
    return (
      <section className="card card-elevated" aria-labelledby="current-goal-heading">
        <h2 id="current-goal-heading" className="card-heading">
          Your Career Goal
        </h2>
        <p className="body-secondary mt-3">
          Complete your profile to personalize your learning journey.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button href="/app/profile">Complete profile</Button>
          <Button href="/app/future-planner" variant="secondary">
            Open Future Planner
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="card card-elevated" aria-labelledby="current-goal-heading">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Current focus</p>
          <h2 id="current-goal-heading" className="card-heading mt-2">
            Your Career Goal
          </h2>
          <p className="mt-3 text-2xl font-medium text-ink" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
            {dashboard.careerGoal ?? "Not set yet"}
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="caption">Target outcome</dt>
              <dd className="body mt-1">{dashboard.targetOutcome ?? "Not set yet"}</dd>
            </div>
            <div>
              <dt className="caption">Current roadmap stage</dt>
              <dd className="body mt-1">{dashboard.stageTitle ?? "Not started yet"}</dd>
            </div>
          </dl>
        </div>
        <div className="shrink-0 rounded-2xl border border-border bg-paper-raised px-5 py-4 text-center">
          <p className="caption">Roadmap progress</p>
          <p className="mt-1 text-3xl font-medium text-ink" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
            {dashboard.roadmapProgress !== null ? `${dashboard.roadmapProgress}%` : "—"}
          </p>
          {dashboard.roadmapProgress === null ? (
            <p className="caption mt-1">Available after plan activity</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TodaysLearningCard({ dashboard }: { dashboard: DashboardView }) {
  return (
    <section className="card card-raised" aria-labelledby="todays-learning-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="todays-learning-heading" className="card-heading">
            Today&apos;s Learning
          </h2>
          <p className="caption mt-1">
            {dashboard.todayTotal > 0
              ? `${dashboard.todayCompleted} completed · ${dashboard.todayPending} pending`
              : "No tasks scheduled for today yet"}
          </p>
        </div>
        <Button href="/app/daily-tasks" variant="secondary" className="shrink-0">
          View All Tasks
        </Button>
      </div>

      {dashboard.todayTotal > 0 ? (
        <>
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-tide"
                style={{ width: `${Math.round((dashboard.todayCompleted / dashboard.todayTotal) * 100)}%` }}
              />
            </div>
            <p className="caption mt-2">
              Daily progress {Math.round((dashboard.todayCompleted / dashboard.todayTotal) * 100)}%
            </p>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {dashboard.todayTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-paper-raised px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                  <p className="caption mt-0.5">
                    {task.skill} · {task.durationMinutes} min
                  </p>
                </div>
                <span className="caption shrink-0 capitalize">{task.status}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="body-secondary mt-4">
          When you have a study plan, today&apos;s tasks will appear here.
        </p>
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
          <dt className="caption">Current roadmap stage</dt>
          <dd className="body mt-1">{dashboard.continueStage ?? "Set a goal to unlock stages"}</dd>
        </div>
        <div>
          <dt className="caption">Current milestone</dt>
          <dd className="body mt-1">{dashboard.continueMilestone ?? "Not available yet"}</dd>
        </div>
        <div>
          <dt className="caption">Recommended next action</dt>
          <dd className="body mt-1">{dashboard.continueAction}</dd>
        </div>
      </dl>
      {dashboard.continueProgress !== null ? (
        <p className="caption mt-4">Progress marker: {dashboard.continueProgress}%</p>
      ) : null}
      <div className="mt-5">
        <Button href={dashboard.continueHref}>{dashboard.continueLabel}</Button>
      </div>
    </section>
  );
}

function PerformancePreviewCard({ dashboard }: { dashboard: DashboardView }) {
  const hasData =
    dashboard.averageQuizScore !== null ||
    dashboard.recentQuizTitle !== null ||
    dashboard.strongArea !== null ||
    dashboard.weakArea !== null;

  return (
    <section className="card card-raised" aria-labelledby="performance-preview-heading">
      <div className="flex items-start justify-between gap-3">
        <h2 id="performance-preview-heading" className="card-heading">
          Performance
        </h2>
        <Button href="/app/performance" variant="secondary" className="shrink-0">
          View Performance
        </Button>
      </div>
      {hasData ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {dashboard.averageQuizScore !== null ? (
            <div>
              <dt className="caption">Average quiz score</dt>
              <dd className="body mt-1">{dashboard.averageQuizScore}%</dd>
            </div>
          ) : null}
          {dashboard.recentQuizTitle ? (
            <div>
              <dt className="caption">Recent quiz</dt>
              <dd className="body mt-1">
                {dashboard.recentQuizTitle}
                {dashboard.recentQuizScore !== null ? ` · ${dashboard.recentQuizScore}%` : ""}
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
              <dt className="caption">Weak area</dt>
              <dd className="body mt-1">{dashboard.weakArea}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="body-secondary mt-4">
          Complete quizzes and study tasks to unlock performance insights.
        </p>
      )}
    </section>
  );
}

function RecommendationCard({ dashboard }: { dashboard: DashboardView }) {
  return (
    <section className="card card-elevated" aria-labelledby="recommended-heading">
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-flex size-9 items-center justify-center rounded-xl bg-info-surface text-tide">
          <IconSpark className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 id="recommended-heading" className="card-heading">
            Recommended for You
          </h2>
          <p className="body mt-3">
            {dashboard.recommendation ??
              "Keep learning—personalized recommendations appear as you build quiz and task history."}
          </p>
          <div className="mt-5">
            <Button href={dashboard.recommendationHref} variant="secondary">
              Open recommendation
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickActions() {
  const actions = [
    { href: "/app/daily-tasks", label: "Start Today's Tasks", icon: IconCheckList },
    { href: "/app/study-plan", label: "Study Plan", icon: IconCalendar },
    { href: "/app/quiz", label: "Take a Quiz", icon: IconQuiz },
    { href: "/app/ai-tutor", label: "Ask AI Tutor", icon: IconTutor },
    { href: "/app/future-planner", label: "View Roadmap", icon: IconTarget },
    { href: "/app/adaptive-plan", label: "Adaptive Plan", icon: IconAdaptive },
    { href: "/app/performance", label: "Performance", icon: IconChart },
  ] as const;

  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="section-heading">
        Quick actions
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.href}>
              <Link
                href={action.href}
                className="card card-quiet flex items-center gap-3 transition hover:border-horizon/40 hover:bg-elevated"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper-raised text-ink">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium text-ink">{action.label}</span>
                <IconArrow className="size-4 shrink-0 text-foreground-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
