import { features } from "@/config/home-content";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";

const FEATURE_ACCENTS = [
  {
    border: "border-l-4 border-l-purple border-border",
    well: "icon-well-purple",
    surface: "bg-gradient-to-br from-elevated to-soft-lavender/70",
  },
  {
    border: "border-l-4 border-l-blue border-border",
    well: "icon-well-blue",
    surface: "bg-gradient-to-br from-elevated to-soft-blue/70",
  },
  {
    border: "border-l-4 border-l-teal border-border",
    well: "icon-well-teal",
    surface: "bg-gradient-to-br from-elevated to-[rgb(13_148_136/0.08)]",
  },
  {
    border: "border-l-4 border-l-emerald border-border",
    well: "icon-well-emerald",
    surface: "bg-gradient-to-br from-elevated to-soft-mint/80",
  },
  {
    border: "border-l-4 border-l-gold border-border",
    well: "icon-well-gold",
    surface: "bg-gradient-to-br from-elevated to-soft-gold/80",
  },
  {
    border: "border-l-4 border-l-coral border-border",
    well: "icon-well-coral",
    surface: "bg-gradient-to-br from-elevated to-soft-peach/80",
  },
] as const;

function featureAccent(index: number) {
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
          {features.map((feature, index) => {
            const accent = featureAccent(index);
            return (
              <Card
                key={feature.title}
                as="li"
                variant="elevated"
                className={cn(accent.border, accent.surface)}
                icon={
                  <span className={cn("icon-well", accent.well)} aria-hidden="true">
                    <FeatureDot />
                  </span>
                }
                title={feature.title}
                footer={<Badge tone="accent">Available</Badge>}
              >
                <p className="body-secondary">{feature.body}</p>
              </Card>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

function FeatureDot() {
  return <span className="size-2 rounded-full bg-current" />;
}
