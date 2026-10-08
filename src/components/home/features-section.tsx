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
          title="What you can use after you sign in."
          description="These capabilities are available in the current product. After onboarding, you move through each step yourself—the app does not run the full journey automatically."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              as="li"
              variant="elevated"
              title={feature.title}
              footer={<Badge tone="accent">Available</Badge>}
            >
              <p className="body-secondary">{feature.body}</p>
            </Card>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
