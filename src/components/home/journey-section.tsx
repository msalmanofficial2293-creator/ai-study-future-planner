import { journeySteps } from "@/config/home-content";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export function JourneySection() {
  return (
    <Section id="journey" labelledBy="journey-heading" tone="raised">
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
            className="absolute top-4 bottom-4 left-[7px] w-px bg-border"
          />
          {journeySteps.map((step, index) => (
            <li key={step.title} className="relative pb-4 pl-8 last:pb-0 sm:pl-10">
              <span
                aria-hidden="true"
                className={
                  index === 0
                    ? "absolute top-5 left-0 size-4 rounded-full border-2 border-background bg-accent"
                    : "absolute top-5 left-0.5 size-3 rounded-full border-2 border-background bg-accent-secondary"
                }
              />
              <Card variant={index % 2 === 0 ? "elevated" : "quiet"}>
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
