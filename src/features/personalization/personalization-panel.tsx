import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  RecommendationActions,
  RefreshAnalysisButton,
} from "@/features/personalization/personalization-actions";
import type {
  PersonalizedRecommendation,
  PersonalizedSkillArea,
  PersonalizationPage,
  PersonalizationResult,
} from "@/features/personalization/types";

type ReadyPage = Extract<PersonalizationPage, { status: "ready" }>;

export function PersonalizationPanel({
  page,
  notice,
}: {
  page: ReadyPage;
  notice?: string;
}) {
  const { result, profile } = page;

  return (
    <div className="flex flex-col gap-8">
      {notice ? (
        <p className="rounded-2xl bg-success-surface px-4 py-3 text-success" role="status">
          {notice}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="body-secondary max-w-2xl">{result.statusSummary}</p>
        <RefreshAnalysisButton />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewCard title="Current Focus" value={result.currentFocus} />
        <OverviewCard title="Recommended Study Priority" value={result.recommendedPriority} />
        <OverviewCard title="Recommended Difficulty" value={labelDifficulty(result.recommendedDifficulty)} />
        <OverviewCard title="Recommended Learning Style" value={result.recommendedLearningApproach} />
        <OverviewCard title="Recommended Next Step" value={result.recommendedNextStep} />
        <OverviewCard title="Career Alignment" value={result.careerAlignment} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AreaList title="Strong Areas" empty="No skill is at 80% or above yet." areas={result.strongAreas} />
        <AreaList
          title="Areas Needing Improvement"
          empty="No skill is below 80% yet."
          areas={result.weakAreas}
        />
      </div>
      <Card variant="raised" title="Personalization Reasoning">
        <ul className="mt-2 flex flex-col gap-3">
          {result.reasoning.map((line) => (
            <li key={line} className="body">
              {line}
            </li>
          ))}
        </ul>
      </Card>
      <Card variant="elevated" title="Recommended actions">
        <p className="body-secondary mt-1">
          Review each recommendation before it changes your study plan. Applying adds a task only when the recommendation includes one.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Meta label="Revision frequency" value={result.revisionFrequency} />
          <Meta label="Task type" value={labelTaskType(result.recommendedTaskType)} />
          <Meta label="Quiz difficulty hint" value={labelDifficulty(result.quizDifficultyHint)} />
        </dl>
        <ul className="mt-6 flex flex-col gap-4">
          {result.recommendations.map((item) => (
            <RecommendationCard key={item.fingerprint} item={item} />
          ))}
        </ul>
      </Card>
      <Card variant="quiet" title="Learner context">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Meta label="Education" value={profile.educationLabel ?? "Not saved"} />
          <Meta label="Field" value={profile.field ?? "Not saved"} />
          <Meta label="Skill level" value={profile.skillLabel ?? "Not saved"} />
          <Meta label="Learning style" value={profile.learningLabel ?? "Not saved"} />
          <Meta label="Weekly study time" value={profile.weeklyLabel ?? "Not saved"} />
          <Meta label="Career goal" value={profile.goalTitle ?? "Not saved"} />
        </dl>
      </Card>
    </div>
  );
}

function OverviewCard({ title, value }: { title: string; value: string }) {
  return (
    <Card variant="raised">
      <p className="caption">{title}</p>
      <p className="body mt-2">{value}</p>
    </Card>
  );
}

function AreaList({
  title,
  empty,
  areas,
}: {
  title: string;
  empty: string;
  areas: PersonalizedSkillArea[];
}) {
  return (
    <Card variant="raised" title={title}>
      {areas.length === 0 ? (
        <p className="body-secondary mt-2">{empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {areas.map((area) => (
            <li key={area.skill} className="flex items-baseline justify-between gap-3">
              <p className="body">{area.skill}</p>
              <p className="caption">
                {area.percent}% · {area.correct}/{area.total}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function RecommendationCard({ item }: { item: PersonalizedRecommendation }) {
  return (
    <li className="rounded-2xl border border-border bg-surface px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="body font-semibold">{item.title}</h3>
        <Badge tone={item.status === "open" ? "accent" : "neutral"}>{labelStatus(item.status)}</Badge>
        <Badge tone="secondary">{labelTaskType(item.kind)}</Badge>
        <Badge tone="neutral">{labelDifficulty(item.difficulty)}</Badge>
      </div>
      <p className="body-secondary mt-2">{item.summary}</p>
      <p className="body mt-3">{item.reasoning}</p>
      {item.alreadyOnPlan ? <p className="caption mt-2">Already on your study plan.</p> : null}
      <RecommendationActions
        fingerprint={item.fingerprint}
        canApply={Boolean(item.task) && !item.alreadyOnPlan}
        status={item.status}
      />
    </li>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="caption">{label}</dt>
      <dd className="body mt-1">{value}</dd>
    </div>
  );
}

function labelDifficulty(value: PersonalizationResult["recommendedDifficulty"]): string {
  if (value === "beginner") {
    return "Beginner";
  }

  if (value === "practice") {
    return "Practice";
  }

  return "Advanced";
}

function labelTaskType(value: PersonalizedRecommendation["kind"] | PersonalizationResult["recommendedTaskType"]): string {
  switch (value) {
    case "revision":
      return "Revision";
    case "practice":
      return "Practice";
    case "new_concept":
      return "New concept";
    case "quiz":
      return "Quiz";
    case "weak_topic":
      return "Weak topic";
    case "review":
      return "Review";
    case "next_skill":
      return "Next skill";
    default:
      return value;
  }
}

function labelStatus(status: PersonalizedRecommendation["status"]): string {
  if (status === "applied") {
    return "Applied";
  }

  if (status === "dismissed") {
    return "Dismissed";
  }

  return "Open";
}
