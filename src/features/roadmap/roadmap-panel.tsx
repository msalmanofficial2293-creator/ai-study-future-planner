import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import type { SavedRoadmap } from "@/features/roadmap/types";

type RoadmapPanelProps = {
  roadmap: SavedRoadmap | null;
  unavailable?: boolean;
};

export function RoadmapPanel({ roadmap, unavailable = false }: RoadmapPanelProps) {
  if (unavailable) {
    return (
      <section aria-labelledby="roadmap-heading" className="flex flex-col gap-4">
        <h2 id="roadmap-heading" className="section-heading">
          Your roadmap
        </h2>
        <p className="field-error" role="alert">
          Error: Something went wrong. Please try again.
        </p>
      </section>
    );
  }

  if (!roadmap) {
    return (
      <section aria-labelledby="roadmap-heading">
        <EmptyState
          title="No roadmap yet"
          description="Generate a roadmap from your current goal. It is saved to your account and stays here after you refresh."
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="roadmap-heading" className="flex flex-col gap-5">
      <Card variant="elevated" className="border-blue/20 bg-gradient-to-br from-soft-blue to-elevated">
        <p className="eyebrow">Roadmap</p>
        <h2 id="roadmap-heading" className="section-heading mt-3">
          {roadmap.title}
        </h2>
        <p className="body-secondary">{roadmap.overview}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="caption">Estimated timeline</p>
            <p className="body mt-1">{roadmap.timeline}</p>
          </div>
          <div>
            <p className="caption">Recommended next steps</p>
            <ol className="mt-1 flex flex-col gap-2">
              {roadmap.nextSteps.map((step) => (
                <li key={step} className="body">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Card>
      <ol className="grid gap-4">
        {roadmap.stages.map((stage, index) => (
          <li key={`${stage.title}-${index}`}>
            <Card
              variant="raised"
              className={
                index % 2 === 0
                  ? "border-purple/15 bg-gradient-to-br from-soft-lavender/80 to-elevated"
                  : "border-blue/15 bg-gradient-to-br from-soft-blue/80 to-elevated"
              }
            >
              <p className="caption">Stage {index + 1}</p>
              <h3 className="card-heading mt-2">{stage.title}</h3>
              <p className="caption mt-4">Skills</p>
              <ul className="mt-2 flex flex-col gap-2">
                {stage.skills.map((skill) => (
                  <li key={skill} className="body">
                    {skill}
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-xl border border-gold/25 bg-soft-gold px-3 py-3">
                <p className="caption text-gold-deep">Milestone</p>
                <p className="body mt-1">{stage.milestone}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
