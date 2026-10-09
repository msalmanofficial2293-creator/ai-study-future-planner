import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppPage } from "@/components/ui/app-page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
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
      <AppPage>
        <PageHeader title="Performance" />
        <p className="field-error" role="alert">
          Error: Something went wrong. Please try again.
        </p>
        <Link href="/app/performance" className="text-link">
          Try again
        </Link>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <PageHeader
        eyebrow="Performance"
        title="Progress from your saved work"
        description="Scores and completion come from your study tasks, quiz attempts, and performance snapshots. This page does not call a paid AI provider, and it does not change your study plan."
      />
      {loaded.status === "empty" ? (
        <PerformanceEmpty hasRoadmap={loaded.hasRoadmap} hasPlan={loaded.hasPlan} />
      ) : null}
      {loaded.status === "ready" ? <PerformanceDashboardView dashboard={loaded.dashboard} /> : null}
    </AppPage>
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
