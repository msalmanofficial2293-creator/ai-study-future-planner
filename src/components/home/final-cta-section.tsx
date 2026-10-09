import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export function FinalCtaSection() {
  return (
    <Section id="start" labelledBy="start-heading" tone="lavender">
      <Container>
        <Card variant="elevated" className="card-band border-purple/20 bg-gradient-to-br from-elevated via-soft-lavender/40 to-soft-blue/50">
          <p className="eyebrow">Next step</p>
          <h2 id="start-heading" className="section-heading mt-3 max-w-xl">
            Ready to turn your goal into a real study plan?
          </h2>
          <p className="body-secondary mt-4 max-w-xl">
            Create your account and start building a structured learning path
            around your goals—roadmap, daily work, practice, progress, and
            guidance in one place.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button href="/signup" className="w-full sm:w-auto">
              Start Planning
            </Button>
            <Button href="/login" variant="secondary" className="w-full sm:w-auto">
              Sign In
            </Button>
          </div>
          <p className="caption mt-4 max-w-xl">
            No payment is required on this site today. After signup you complete
            a short onboarding profile, then open your account tools.
          </p>
        </Card>
      </Container>
    </Section>
  );
}
