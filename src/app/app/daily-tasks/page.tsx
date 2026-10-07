import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/feedback";
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
      <Container className="py-12 sm:py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-4">
          <h1 className="page-heading">Daily Tasks</h1>
          <p className="field-error" role="alert">
            Error: Something went wrong. Please try again.
          </p>
          <Link href="/app/daily-tasks" className="font-medium text-accent-deep underline underline-offset-4">
            Try again
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Daily Tasks</p>
          <h1 className="page-heading mt-3">Today&apos;s work</h1>
          <p className="body-secondary mt-3">
            These tasks come from your current study plan. This page does not call a paid AI
            provider, and it does not change the plan from performance.
          </p>
        </div>
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
      </div>
    </Container>
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
      <p className="body-secondary">Completed tasks planned for today, out of every task planned for today.</p>
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
          <dd className="body mt-1">{day.planTitle}</dd>
        </div>
        <div>
          <dt className="caption">Current roadmap</dt>
          <dd className="body mt-1">{day.roadmapTitle}</dd>
        </div>
      </dl>
    </Card>
  );
}
