import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { HeroPreview } from "@/components/home/hero-preview";

export function HeroSection() {
  return (
    <Section labelledBy="hero-heading" tone="plain" className="page-scene-landing-hero">
      <Container className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:gap-14">
        <div className="hero-copy">
          <p className="eyebrow">AI Study Future Planner</p>
          <div
            aria-hidden="true"
            className="mt-5 h-1.5 w-20 rounded-full bg-gradient-to-r from-purple via-blue to-teal"
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
            <Button href="/login" variant="secondary" className="w-full sm:w-auto">
              Sign In
            </Button>
          </div>
          <p className="caption mt-4 max-w-xl">
            Create a free account, complete onboarding, and continue your
            learning path across sessions. AI-assisted steps currently use
            development-mode generators and rules—not a paid live model.
          </p>
        </div>
        <HeroPreview />
      </Container>
    </Section>
  );
}
