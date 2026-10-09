import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppPage } from "@/components/ui/app-page";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { GoalForm } from "@/features/future-planner/goal-form";
import { RoadmapCta } from "@/features/future-planner/roadmap-cta";
import { RoadmapPanel } from "@/features/roadmap/roadmap-panel";
import { loadFuturePlanner } from "@/services/future-planner";
import { loadCurrentRoadmap } from "@/services/roadmap";

export const metadata: Metadata = {
  title: "Future Planner",
  robots: { index: false, follow: false },
};

export default async function FuturePlannerPage() {
  const loaded = await loadFuturePlanner();

  if (loaded.status === "unauthenticated") {
    redirect("/login");
  }

  if (loaded.status === "incomplete") {
    redirect("/onboarding");
  }

  if (loaded.status === "unavailable") {
    return (
      <AppPage scene="planner">
        <PageHeader title="Future Planner" />
        <p className="field-error" role="alert">
          Error: Something went wrong. Please try again.
        </p>
        <Link href="/app/future-planner" className="text-link">
          Try again
        </Link>
      </AppPage>
    );
  }

  const { planner } = loaded;
  const roadmap = await loadCurrentRoadmap();

  if (roadmap.status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <AppPage scene="planner">
      <PageHeader
        eyebrow="Future Planner"
        title="Your goal"
        description="This is the destination the rest of your study will follow. Generate a roadmap from this goal. Study plans and quizzes are not created yet."
        actions={<RoadmapCta hasGoal={planner.hasGoal} />}
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <div className="flex flex-col gap-5">
          {planner.hasGoal ? (
            <Card variant="elevated">
              <h2 className="section-heading">{planner.careerGoal}</h2>
              <p className="body-secondary">{planner.targetOutcome}</p>
            </Card>
          ) : (
            <EmptyState
              title="No goal yet"
              description="Add a career goal and a target outcome. A roadmap can be generated after the goal is saved."
            />
          )}
          <Card variant="raised">
            <h2 className="card-heading">Update your goal</h2>
            <p className="caption">
              Education, field, skill, study time, and learning style stay as you set them during
              onboarding.
            </p>
            <GoalForm careerGoal={planner.careerGoal} targetOutcome={planner.targetOutcome} />
          </Card>
        </div>
        <div className="flex flex-col gap-5">
          <Card variant="quiet">
            <h2 className="card-heading">From onboarding</h2>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <ContextItem label="Career goal" value={planner.hasGoal ? planner.careerGoal : "Not set yet"} />
              <ContextItem label="Target outcome" value={planner.targetOutcome || "Not set yet"} />
              <ContextItem label="Education level" value={planner.educationLevel} />
              <ContextItem label="Field of study" value={planner.fieldOfStudy} />
              <ContextItem label="Skill level" value={planner.skillLevel} />
              <ContextItem label="Weekly study time" value={planner.weeklyStudyTime} />
              <ContextItem label="Learning style" value={planner.learningStyle} />
            </dl>
          </Card>
        </div>
      </div>
      <RoadmapPanel
        roadmap={roadmap.status === "ready" ? roadmap.roadmap : null}
        unavailable={roadmap.status === "unavailable"}
      />
    </AppPage>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="caption">{label}</dt>
      <dd className="body mt-1 break-words">{value}</dd>
    </div>
  );
}
