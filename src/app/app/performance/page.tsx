import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/feedback";
import { PerformanceDashboardView } from "@/features/performance/performance-dashboard";
import { loadPerformancePage } from "@/services/performance";

export const metadata: Metadata = {
  title: "Performance",
  robots: { index: false, follow: false },
};

export default async function PerformancePage() {
  const loaded = await loadPerformancePage();

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
          <h1 className="page-heading">Performance</h1>
          <p className="field-error" role="alert">
            Error: Something went wrong. Please try again.
          </p>
          <Link href="/app/performance" className="font-medium text-accent-deep underline underline-offset-4">
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
          <p className="eyebrow">Performance</p>
          <h1 className="page-heading mt-3">Progress from your saved work</h1>
          <p className="body-secondary mt-3">
            Scores and completion come from your study tasks, quiz attempts, and performance
            snapshots. This page does not call a paid AI provider, and it does not change your
            study plan.
          </p>
        </div>
        {loaded.status === "empty" ? <PerformanceEmpty hasRoadmap={loaded.hasRoadmap} hasPlan={loaded.hasPlan} /> : null}
        {loaded.status === "ready" ? <PerformanceDashboardView dashboard={loaded.dashboard} /> : null}
      </div>
    </Container>
  );
}

function PerformanceEmpty({ hasRoadmap, hasPlan }: { hasRoadmap: boolean; hasPlan: boolean }) {
  if (!hasRoadmap) {
    return (
      <EmptyState
        title="No progress to show yet"
        description="Generate a roadmap, then complete a study task or submit a quiz. This page shows only results saved on your account."
        action={<Button href="/app/future-planner">Open Future Planner</Button>}
      />
    );
  }

  if (!hasPlan) {
    return (
      <EmptyState
        title="No progress to show yet"
        description="Save a study task, then complete it or submit a quiz. Statistics appear after that work is stored."
        action={<Button href="/app/study-plan">Open Study Plan</Button>}
      />
    );
  }

  return (
    <EmptyState
      title="No progress to show yet"
      description="Complete a study task or submit a quiz. This page will use those saved results. It does not fill in sample scores."
      action={
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/app/daily-tasks">Open Daily Tasks</Button>
          <Button href="/app/quiz" variant="secondary">
            Open AI Quiz
          </Button>
        </div>
      }
    />
  );
}
