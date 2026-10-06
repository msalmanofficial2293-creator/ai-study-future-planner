import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export function FinalCtaSection() {
  return (
    <Section id="start" labelledBy="start-heading" tone="plain">
      <Container>
        <Card variant="elevated" className="card-band">
          <p className="eyebrow">Next step</p>
          <h2 id="start-heading" className="section-heading mt-3 max-w-xl">
            Your future needs a plan.
          </h2>
          <p className="body-secondary mt-4 max-w-xl">
            Personal planning is part of the product roadmap. This page does not
            create an account, save a goal, or generate a study plan.
          </p>
          <div className="mt-8 w-full sm:w-auto">
            <Button href="#how-it-works" className="w-full sm:w-auto">
              Start Planning Your Future
            </Button>
          </div>
          <p className="caption mt-4 max-w-xl">
            This does not open an account. It shows the path a plan is designed
            to follow.
          </p>
        </Card>
      </Container>
    </Section>
  );
}
