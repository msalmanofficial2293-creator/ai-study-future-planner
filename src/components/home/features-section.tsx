import { features } from "@/config/home-content";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

const FEATURE_ACCENTS = [
  "border-l-4 border-l-purple border-border",
  "border-l-4 border-l-blue border-border",
  "border-l-4 border-l-teal border-border",
  "border-l-4 border-l-emerald border-border",
  "border-l-4 border-l-gold border-border",
  "border-l-4 border-l-coral border-border",
] as const;

function featureAccentClass(index: number): string {
  return FEATURE_ACCENTS[index % FEATURE_ACCENTS.length] ?? FEATURE_ACCENTS[0];
}

export function FeaturesSection() {
  return (
    <Section id="features" labelledBy="features-heading" tone="cool">
      <Container>
        <SectionHeading
          id="features-heading"
          eyebrow="Features"
          title="What you can use after you sign in."
          description="These capabilities are available in the current product. After onboarding, you move through each step yourself—the app does not run the full journey automatically."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              as="li"
              variant="elevated"
              className={featureAccentClass(index)}
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
