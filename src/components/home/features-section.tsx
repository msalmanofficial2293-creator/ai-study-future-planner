import { features } from "@/config/home-content";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export function FeaturesSection() {
  return (
    <Section id="features" labelledBy="features-heading" tone="raised">
      <Container>
        <SectionHeading
          id="features-heading"
          eyebrow="Features"
          title="What the journey is designed to include."
          description="These are product capabilities on the roadmap. They are not switched on, and this page cannot generate a plan, quiz, or tutor reply."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              as="li"
              variant="elevated"
              title={feature.title}
              footer={<Badge tone="neutral">Planned</Badge>}
            >
              <p className="body-secondary">{feature.body}</p>
            </Card>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
