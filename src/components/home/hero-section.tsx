import { heroPath } from "@/config/home-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export function HeroSection() {
  return (
    <Section labelledBy="hero-heading">
      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)] lg:gap-16">
        <div>
          <p className="eyebrow">For students with a destination</p>
          <div aria-hidden="true" className="mt-5 h-px w-16 bg-accent" />
          <h1 id="hero-heading" className="display-heading mt-5 max-w-xl">
            Turn your future goal into a clear learning path.
          </h1>
          <p className="lede mt-6 max-w-xl">
            AI Study Future Planner helps students turn one future goal into a
            learning journey. The path is designed to connect a goal, a roadmap,
            a study plan, daily tasks, practice, and progress.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="#start" className="w-full sm:w-auto">
              Build My Study Plan
            </Button>
            <Button
              href="#how-it-works"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              See How It Works
            </Button>
          </div>
          <p className="caption mt-4 max-w-xl">
            Study plans are not available yet. You can create an account and sign
            in. An account does not generate a study plan.
          </p>
        </div>
        <aside aria-labelledby="path-heading" className="min-w-0">
          <Card variant="elevated">
            <div>
              <p id="path-heading" className="principle-heading">
                The path
              </p>
              <p className="caption mt-2">
                One journey, from the goal you name to the work that follows.
              </p>
            </div>
            <ol className="border-l border-border">
              {heroPath.map((step, index) => (
                <li key={step.title} className="relative py-2 pl-5">
                  <span
                    aria-hidden="true"
                    className={
                      index === 0
                        ? "absolute top-4 -left-1.5 size-2.5 rounded-full bg-accent"
                        : "absolute top-5 -left-1 size-2 rounded-full bg-accent-secondary"
                    }
                  />
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Badge tone={index === 0 ? "accent" : "secondary"}>
                      <span className="sr-only">Step </span>
                      {index + 1}
                    </Badge>
                    <p className="text-sm font-medium text-foreground">
                      {step.title}
                    </p>
                  </div>
                  <p className="caption mt-1">{step.detail}</p>
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </Container>
    </Section>
  );
}
