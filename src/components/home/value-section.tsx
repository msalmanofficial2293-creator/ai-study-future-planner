import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export function ValueSection() {
  return (
    <Section id="product" labelledBy="product-heading" tone="lavender">
      <Container>
        <div className="max-w-3xl">
          <SectionHeading
            id="product-heading"
            eyebrow="The product"
            title="A connected learning journey, not scattered tools."
            description="Students often know where they want to go but struggle to know what to study, in what order, and what to do today. AI Study Future Planner connects that long-term direction with daily execution."
          />
          <p className="body mt-8 max-w-2xl">
            Goal → Future Roadmap → Study Plan → Daily Tasks → Quiz →
            Performance → Adaptive Plan → AI Tutor → Personalization. You move
            through each stage after sign-in; the same goal stays visible from
            planning through practice and review.
          </p>
        </div>
      </Container>
    </Section>
  );
}
