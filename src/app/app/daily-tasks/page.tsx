import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppPage } from "@/components/ui/app-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { DailyBoard } from "@/features/daily-tasks/daily-board";
import { loadDailyTasks } from "@/services/daily-tasks";

export const metadata: Metadata = {
  title: "Daily Tasks",
  robots: { index: false, follow: false },
};

export default async function DailyTasksPage() {
  const loaded = await loadDailyTasks();

  if (loaded.status === "unauthenticated") {
    redirect("/login");
  }

  if (loaded.status === "incomplete") {
    redirect("/onboarding");
  }

  if (loaded.status === "unavailable") {
    return (
      <AppPage>
        <PageHeader title="Daily Tasks" />
        <p className="field-error" role="alert">
          Error: Something went wrong. Please try again.
        </p>
        <Link href="/app/daily-tasks" className="text-link">
          Try again
        </Link>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <PageHeader
        eyebrow="Daily Tasks"
        title="Today's work"
        description="These tasks come from your current study plan. This page does not call a paid AI provider, and it does not change the plan from performance."
      />
      {loaded.status === "no-roadmap" ? (
        <EmptyState
          title="No roadmap yet"
          description="Generate a roadmap, then add tasks on your study plan. Today's list follows that plan."
          action={<Button href="/app/future-planner">Open Future Planner</Button>}
        />
      ) : (
        <>
          <DailyProgress day={loaded.day} />
          <DailyBoard day={loaded.day} />
        </>
      )}
    </AppPage>
  );
}

function DailyProgress({
  day,
}: {
  day: Extract<Awaited<ReturnType<typeof loadDailyTasks>>, { status: "ready" }>["day"];
}) {
  const percent = day.dayTotal === 0 ? 0 : Math.round((day.dayCompleted / day.dayTotal) * 100);

  return (
    <Card variant="elevated">
      <p className="caption">Daily progress</p>
      <h2 className="section-heading mt-2">
        {day.dayCompleted} / {day.dayTotal} tasks
      </h2>
      <p className="body-secondary">
        Completed on today&apos;s date, out of overdue or due-today work still open plus what you
        finished today.
      </p>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Daily task progress"
      >
        <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
      <p className="caption mt-3">{percent}% complete today.</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="caption">Study plan</dt>
          <dd className="body mt-1 break-words">{day.planTitle}</dd>
        </div>
        <div>
          <dt className="caption">Current roadmap</dt>
          <dd className="body mt-1 break-words">{day.roadmapTitle}</dd>
        </div>
      </dl>
    </Card>
  );
}
