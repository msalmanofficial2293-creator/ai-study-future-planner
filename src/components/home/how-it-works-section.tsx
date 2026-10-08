import { howItWorks } from "@/config/home-content";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export function HowItWorksSection() {
  return (
    <Section id="how-it-works" labelledBy="how-heading">
      <Container>
        <SectionHeading
          id="how-heading"
          eyebrow="How it works"
          title="Five steps from your profile to guided improvement."
          description="Create an account, complete onboarding, then move through each stage in the app. Recommendations and AI-assisted tools support you—they do not replace your decisions."
        />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-5">
          {howItWorks.map((step, index) => (
            <li key={step.title} className="card card-quiet">
              <p className="index-label">
                <span className="sr-only">Step </span>
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="principle-heading">{step.title}</h3>
              <p className="body-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
