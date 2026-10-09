import { journeySteps } from "@/config/home-content";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";

const STEP_SURFACES = [
  "border-purple/20 bg-gradient-to-br from-elevated to-soft-lavender/70",
  "border-blue/20 bg-gradient-to-br from-elevated to-soft-blue/70",
  "border-teal/20 bg-gradient-to-br from-elevated to-[rgb(13_148_136/0.08)]",
  "border-emerald/20 bg-gradient-to-br from-elevated to-soft-mint/80",
] as const;

export function JourneySection() {
  return (
    <Section id="journey" labelledBy="journey-heading" tone="journey">
      <Container>
        <SectionHeading
          id="journey-heading"
          eyebrow="Learning journey"
          title="From a goal to personalized guidance."
          description="Nine stages, in this order. Each one uses the same signed-in account and the goal you save."
        />
        <ol className="relative mx-auto mt-12 max-w-3xl">
          <span
            aria-hidden="true"
            className="absolute top-4 bottom-4 left-[7px] w-px bg-gradient-to-b from-purple via-blue to-emerald"
          />
          {journeySteps.map((step, index) => (
            <li key={step.title} className="relative pb-4 pl-8 last:pb-0 sm:pl-10">
              <span
                aria-hidden="true"
                className={
                  index === 0
                    ? "absolute top-5 left-0 size-4 rounded-full border-2 border-elevated bg-purple"
                    : index % 3 === 1
                      ? "absolute top-5 left-0.5 size-3 rounded-full border-2 border-elevated bg-blue"
                      : index % 3 === 2
                        ? "absolute top-5 left-0.5 size-3 rounded-full border-2 border-elevated bg-teal"
                        : "absolute top-5 left-0.5 size-3 rounded-full border-2 border-elevated bg-emerald"
                }
              />
              <Card
                variant="elevated"
                className={cn(
                  "shadow-[var(--shadow-soft)]",
                  STEP_SURFACES[index % STEP_SURFACES.length],
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={index === 0 ? "accent" : "secondary"}>
                    <span className="sr-only">Stage </span>
                    {String(index + 1).padStart(2, "0")}
                  </Badge>
                  <h3 className="card-heading">{step.title}</h3>
                </div>
                <p className="body-secondary">{step.summary}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
