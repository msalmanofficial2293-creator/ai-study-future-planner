import { howItWorks } from "@/config/home-content";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";

const STEP_ACCENTS = [
  {
    border: "border-purple/25",
    well: "icon-well-purple",
    index: "text-purple-deep",
    bar: "bg-purple",
  },
  {
    border: "border-blue/25",
    well: "icon-well-blue",
    index: "text-blue-deep",
    bar: "bg-blue",
  },
  {
    border: "border-teal/25",
    well: "icon-well-teal",
    index: "text-teal",
    bar: "bg-teal",
  },
  {
    border: "border-emerald/25",
    well: "icon-well-emerald",
    index: "text-emerald",
    bar: "bg-emerald",
  },
  {
    border: "border-gold/30",
    well: "icon-well-gold",
    index: "text-gold-deep",
    bar: "bg-gold",
  },
] as const;

export function HowItWorksSection() {
  return (
    <Section id="how-it-works" labelledBy="how-heading" tone="sky">
      <Container>
        <SectionHeading
          id="how-heading"
          eyebrow="How it works"
          title="Five steps from your profile to guided improvement."
          description="Create an account, complete onboarding, then move through each stage in the app. Recommendations and AI-assisted tools support you—they do not replace your decisions."
        />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-5">
          {howItWorks.map((step, index) => {
            const accent = STEP_ACCENTS[index % STEP_ACCENTS.length] ?? STEP_ACCENTS[0];
            return (
              <li
                key={step.title}
                className={cn(
                  "card card-elevated relative overflow-hidden",
                  accent.border,
                  index % 2 === 0
                    ? "bg-gradient-to-br from-elevated to-soft-blue/50"
                    : "bg-gradient-to-br from-elevated to-soft-lavender/60",
                )}
              >
                <span
                  className={cn("absolute top-0 left-0 h-1 w-full", accent.bar)}
                  aria-hidden="true"
                />
                <span className={cn("icon-well mt-1", accent.well)} aria-hidden="true">
                  <span className="size-2 rounded-full bg-current" />
                </span>
                <p className={cn("index-label", accent.index)}>
                  <span className="sr-only">Step </span>
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="principle-heading">{step.title}</h3>
                <p className="body-secondary">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}
