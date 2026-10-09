import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppPage } from "@/components/ui/app-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { TaskBoard } from "@/features/study-plan/task-board";
import { formatStudyHours } from "@/features/study-plan/schedule";
import { loadStudyPlan } from "@/services/study-plan";

export const metadata: Metadata = {
  title: "Study Plan",
  robots: { index: false, follow: false },
};

export default async function StudyPlanPage() {
  const loaded = await loadStudyPlan();

  if (loaded.status === "unauthenticated") {
    redirect("/login");
  }

  if (loaded.status === "incomplete") {
    redirect("/onboarding");
  }

  if (loaded.status === "unavailable") {
    return (
      <AppPage>
        <PageHeader title="Study Plan" />
        <p className="field-error" role="alert">
          Error: Something went wrong. Please try again.
        </p>
        <Link href="/app/study-plan" className="text-link">
          Try again
        </Link>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <PageHeader
        eyebrow="Study Plan"
        title="Your study plan"
        description="Tasks follow your current roadmap. This page does not call a paid AI provider, and it does not revise the plan from performance."
      />
      {loaded.status === "no-roadmap" ? (
        <EmptyState
          title="No roadmap yet"
          description="Generate a roadmap in Future Planner. Your study plan is built from that roadmap."
          action={<Button href="/app/future-planner">Open Future Planner</Button>}
        />
      ) : (
        <>
          <PlanSummary plan={loaded.plan} />
          <TaskBoard plan={loaded.plan} />
        </>
      )}
    </AppPage>
  );
}

function PlanSummary({ plan }: { plan: Extract<Awaited<ReturnType<typeof loadStudyPlan>>, { status: "ready" }>["plan"] }) {
  const percent = plan.weekTotal === 0 ? 0 : Math.round((plan.weekCompleted / plan.weekTotal) * 100);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card variant="elevated" className="sm:col-span-2 lg:col-span-1">
        <p className="caption">Current roadmap</p>
        <h2 className="card-heading mt-2">{plan.roadmapTitle}</h2>
        <p className="body-secondary">{plan.roadmapTimeline}</p>
      </Card>
      <Card variant="raised">
        <p className="caption">Current learning stage</p>
        <h2 className="card-heading mt-2">{plan.stageTitle}</h2>
        <p className="body-secondary">{plan.stageMilestone}</p>
      </Card>
      <Card variant="quiet">
        <p className="caption">Weekly study target</p>
        <p className="body mt-2">{plan.weeklyTarget}</p>
        <p className="caption mt-4">Planned study time</p>
        <p className="body mt-1">{formatStudyHours(plan.plannedMinutes)} this week</p>
      </Card>
      <Card variant="raised" className="sm:col-span-2">
        <p className="caption">Study subjects</p>
        {plan.subjects.length === 0 ? (
          <p className="body-secondary mt-2">Subjects appear when a stage or task names a skill.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {plan.subjects.map((subject) => (
              <li key={subject} className="body">
                {subject}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card variant="elevated">
        <p className="caption">Weekly progress</p>
        <p className="card-heading mt-2">
          {plan.weekCompleted} of {plan.weekTotal} tasks
        </p>
        <div
          className="progress-track mt-4 h-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Weekly task progress"
        >
          <div className="progress-fill-teal h-full rounded-full" style={{ width: `${percent}%` }} />
        </div>
        <p className="caption mt-3">{percent}% of this week&apos;s tasks are complete.</p>
      </Card>
    </div>
  );
}
