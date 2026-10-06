import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/feedback";
import { GoalForm } from "@/features/future-planner/goal-form";
import { RoadmapCta } from "@/features/future-planner/roadmap-cta";
import { loadFuturePlanner } from "@/services/future-planner";

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
      <Container className="py-12 sm:py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-4">
          <h1 className="page-heading">Future Planner</h1>
          <p className="field-error" role="alert">
            Error: Something went wrong. Please try again.
          </p>
          <Link href="/app/future-planner" className="font-medium text-accent-deep underline underline-offset-4">
            Try again
          </Link>
        </div>
      </Container>
    );
  }

  const { planner } = loaded;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Future Planner</p>
          <h1 className="page-heading mt-3">Your goal</h1>
          <p className="body-secondary mt-3">
            This is the destination the rest of your study will follow. Roadmaps, plans, and
            quizzes are not generated yet.
          </p>
        </div>
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
                description="Add a career goal and a target outcome. That goal stays yours and is ready for a roadmap later."
              />
            )}
            <Card variant="raised">
              <h2 className="card-heading">Update your goal</h2>
              <p className="caption">
                Education, field, skill, study time, and learning style stay as you set them
                during onboarding.
              </p>
              <GoalForm careerGoal={planner.careerGoal} targetOutcome={planner.targetOutcome} />
            </Card>
          </div>
          <div className="flex flex-col gap-5">
            <Card variant="quiet">
              <h2 className="card-heading">Study context</h2>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <ContextItem label="Education level" value={planner.educationLevel} />
                <ContextItem label="Field of study" value={planner.fieldOfStudy} />
                <ContextItem label="Skill level" value={planner.skillLevel} />
                <ContextItem label="Weekly study time" value={planner.weeklyStudyTime} />
                <ContextItem label="Learning style" value={planner.learningStyle} />
              </dl>
            </Card>
            <Card variant="elevated">
              <h2 className="card-heading">Next step</h2>
              <RoadmapCta />
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="caption">{label}</dt>
      <dd className="body mt-1">{value}</dd>
    </div>
  );
}
