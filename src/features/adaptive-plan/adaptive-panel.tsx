import { Card } from "@/components/ui/card";
import { AdaptiveActions } from "@/features/adaptive-plan/adaptive-actions";
import type { AdaptiveReady, SkillArea } from "@/features/adaptive-plan/types";

export function AdaptivePanel({
  page,
  notice,
}: {
  page: AdaptiveReady;
  notice?: string;
}) {
  const { recommendation, saved } = page;

  return (
    <div className="flex flex-col gap-8">
      {notice ? (
        <p className="body" role="status">
          {notice}
        </p>
      ) : null}
      <Card variant="elevated">
        <p className="caption">Current learning status</p>
        <h2 className="section-heading mt-2">{page.planTitle}</h2>
        <p className="body mt-3">{recommendation.statusSummary}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="caption">Roadmap</dt>
            <dd className="body mt-1">{page.roadmapTitle}</dd>
          </div>
          <div>
            <dt className="caption">Saved adaptive plan</dt>
            <dd className="body mt-1">{saved ? `${labelStatus(saved.status)} · ${formatWhen(saved.createdAt)}` : "Not saved yet"}</dd>
          </div>
        </dl>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <AreaList title="Strong areas" empty="No skill is at 80% or above yet." areas={recommendation.strongAreas} />
        <AreaList title="Weak areas" empty="No skill is below 80% yet." areas={recommendation.weakAreas} />
      </div>
      <Card variant="raised">
        <h2 className="card-heading">Recommended changes</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {recommendation.changes.map((change) => (
            <li key={change} className="body">
              {change}
            </li>
          ))}
        </ul>
      </Card>
      <Card variant="raised">
        <h2 className="card-heading">Updated study priorities</h2>
        <ol className="mt-4 flex list-decimal flex-col gap-3 pl-5">
          {recommendation.priorities.map((priority) => (
            <li key={priority} className="body">
              {priority}
            </li>
          ))}
        </ol>
      </Card>
      <Card variant="raised">
        <h2 className="card-heading">Recommended next tasks</h2>
        {recommendation.tasks.length === 0 ? (
          <p className="body-secondary mt-3">No new task follows from these scores.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {recommendation.tasks.map((task) => (
              <li key={task.title} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                <p className="body">{task.title}</p>
                <p className="caption mt-1">
                  {task.skill} · {task.milestoneTitle} · {formatDay(task.scheduledOn)} · {task.durationMinutes} min
                  {task.alreadyOnPlan ? " · Already on your study plan" : ""}
                </p>
                <p className="body-secondary mt-2">{task.description}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <AdaptiveActions />
    </div>
  );
}

function AreaList({ title, empty, areas }: { title: string; empty: string; areas: SkillArea[] }) {
  return (
    <Card variant="raised">
      <h2 className="card-heading">{title}</h2>
      {areas.length === 0 ? (
        <p className="body-secondary mt-3">{empty}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
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

function labelStatus(status: "draft" | "applied" | "discarded"): string {
  if (status === "applied") {
    return "Applied";
  }

  if (status === "discarded") {
    return "Discarded";
  }

  return "Draft";
}

function formatWhen(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Saved";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDay(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return "Scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
