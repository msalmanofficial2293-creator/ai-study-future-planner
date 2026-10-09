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
          <p className="eyebrow">AI Study Future Planner</p>
          <div
            aria-hidden="true"
            className="mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-purple via-blue to-teal"
          />
          <h1 id="hero-heading" className="display-heading mt-5 max-w-xl">
            Turn Your Career Goal Into a Personalized Study Journey
          </h1>
          <p className="lede mt-6 max-w-xl">
            AI Study Future Planner helps you plan what to learn, organize your
            study time, practice with quizzes, track your progress, and get
            personalized guidance along the way.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/signup" className="w-full sm:w-auto">
              Get Started
            </Button>
            <Button
              href="/login"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Sign In
            </Button>
          </div>
          <p className="caption mt-4 max-w-xl">
            Create a free account, complete onboarding, and continue your
            learning path across sessions. AI-assisted steps currently use
            development-mode generators and rules—not a paid live model.
          </p>
        </div>
        <aside aria-labelledby="path-heading" className="min-w-0">
          <Card variant="elevated" className="border-purple/15 bg-gradient-to-b from-soft-lavender/50 to-elevated">
            <div>
              <p id="path-heading" className="principle-heading">
                The learning journey
              </p>
              <p className="caption mt-2">
                One connected path from the goal you name to guided practice and
                review.
              </p>
            </div>
            <ol className="max-h-[28rem] overflow-y-auto border-l border-border pr-1">
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
