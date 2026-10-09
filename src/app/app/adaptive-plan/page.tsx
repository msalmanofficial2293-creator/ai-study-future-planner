import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppPage } from "@/components/ui/app-page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { AdaptivePanel } from "@/features/adaptive-plan/adaptive-panel";
import { loadAdaptivePlan } from "@/services/adaptive-plan";

export const metadata: Metadata = {
  title: "Adaptive Study Plan",
  robots: { index: false, follow: false },
};

type AdaptivePageProps = {
  searchParams: Promise<{ notice?: string; error?: string }>;
};

const NOTICES: Record<string, string> = {
  saved: "Recommendation saved.",
  applied: "Changes applied to your study plan.",
  already: "Your study plan already includes these tasks.",
};

const ERRORS: Record<string, string> = {
  save: "The recommendation could not be saved. Please try again.",
  apply: "The study plan could not be updated. Please try again.",
};

export default async function AdaptivePlanPage({ searchParams }: AdaptivePageProps) {
  const params = await searchParams;
  const loaded = await loadAdaptivePlan();

  if (loaded.status === "unauthenticated") {
    redirect("/login");
  }

  if (loaded.status === "incomplete") {
    redirect("/onboarding");
  }

  if (loaded.status === "unavailable") {
    return (
      <AppPage>
        <PageHeader title="Adaptive Study Plan" />
        <p className="field-error" role="alert">
          Error: Something went wrong. Please try again.
        </p>
        <Link href="/app/adaptive-plan" className="text-link">
          Try again
        </Link>
      </AppPage>
    );
  }

  const notice = typeof params.notice === "string" ? NOTICES[params.notice] : undefined;
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;

  return (
    <AppPage>
      <PageHeader
        eyebrow="Adaptive Study Plan"
        title="Adjust later work from saved results"
        description="Recommendations use your quiz answers, task completion, and roadmap skills. This page does not call a paid AI provider. Changes are added to your current study plan only when you apply them."
      />
      {error ? (
        <p className="field-error" role="alert">
          Error: {error}
        </p>
      ) : null}
      {loaded.status === "no-roadmap" ? (
        <EmptyState
          title="No roadmap yet"
          description="Generate a roadmap and submit a quiz before this page can recommend a change."
          action={<Button href="/app/future-planner">Open Future Planner</Button>}
        />
      ) : null}
      {loaded.status === "no-plan" ? (
        <EmptyState
          title="No study plan yet"
          description="Save a study task, then submit a quiz. Recommendations are applied to that plan."
          action={<Button href="/app/study-plan">Open Study Plan</Button>}
        />
      ) : null}
      {loaded.status === "insufficient" ? (
        <EmptyState
          title="More quiz results are needed"
          description="Submit at least one quiz with saved answers. This page will not invent weak areas, strong areas, or tasks before that evidence exists."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/app/quiz">Open AI Quiz</Button>
              <Button href="/app/performance" variant="secondary">
                Open Performance
              </Button>
            </div>
          }
        />
      ) : null}
      {loaded.status === "ready" ? <AdaptivePanel page={loaded} notice={notice} /> : null}
    </AppPage>
  );
}
