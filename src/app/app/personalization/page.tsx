import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppPage } from "@/components/ui/app-page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { PersonalizationPanel } from "@/features/personalization/personalization-panel";
import { loadPersonalizationPage } from "@/services/personalization";

export const metadata: Metadata = {
  title: "Personalization",
  robots: { index: false, follow: false },
};

type PersonalizationPageProps = {
  searchParams: Promise<{ notice?: string; error?: string }>;
};

const NOTICES: Record<string, string> = {
  applied: "Recommendation applied to your study plan.",
  marked: "Recommendation marked as followed.",
  already: "That recommendation is already on your study plan.",
  dismissed: "Recommendation dismissed.",
  refreshed: "Personalization analysis refreshed.",
};

const ERRORS: Record<string, string> = {
  apply: "The recommendation could not be applied. Please try again.",
  dismiss: "The recommendation could not be dismissed. Please try again.",
  refresh: "The analysis could not be refreshed. Please try again.",
  missing: "That recommendation is no longer available.",
};

export default async function PersonalizationPage({ searchParams }: PersonalizationPageProps) {
  const params = await searchParams;
  const loaded = await loadPersonalizationPage();

  if (loaded.status === "unauthenticated") {
    redirect("/login");
  }

  if (loaded.status === "incomplete") {
    redirect("/onboarding");
  }

  if (loaded.status === "unavailable") {
    return (
      <AppPage>
        <PageHeader title="Personalized Learning Overview" />
        <p className="field-error" role="alert">
          Error: Something went wrong. Please try again.
        </p>
        <Link href="/app/personalization" className="text-link">
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
        eyebrow="AI Personalization"
        title="Personalized Learning Overview"
        description="Recommendations use your saved profile, roadmap, study plan, tasks, and quiz results. This page uses rule-based personalization and does not call a paid AI provider."
      />
      {error ? (
        <p className="field-error" role="alert">
          Error: {error}
        </p>
      ) : null}
      {loaded.status === "no-roadmap" ? (
        <EmptyState
          title="No roadmap yet"
          description="Generate a roadmap, save study tasks, and submit a quiz to unlock personalized recommendations."
          action={<Button href="/app/future-planner">Open Future Planner</Button>}
        />
      ) : null}
      {loaded.status === "no-plan" ? (
        <EmptyState
          title="No study plan yet"
          description="Save a study task, then submit a quiz. Personalization recommendations are tied to that plan."
          action={<Button href="/app/study-plan">Open Study Plan</Button>}
        />
      ) : null}
      {loaded.status === "insufficient" ? (
        <EmptyState
          title="Complete a few study tasks and quizzes to unlock personalized recommendations"
          description="This page needs at least one submitted quiz with saved answers. It will not invent weak areas, strong areas, difficulty, or next steps before that evidence exists."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/app/quiz">Open AI Quiz</Button>
              <Button href="/app/daily-tasks" variant="secondary">
                Open Daily Tasks
              </Button>
            </div>
          }
        />
      ) : null}
      {loaded.status === "ready" ? <PersonalizationPanel page={loaded} notice={notice} /> : null}
    </AppPage>
  );
}
