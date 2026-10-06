import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export function ValueSection() {
  return (
    <Section id="product" labelledBy="product-heading" tone="raised">
      <Container>
        <div className="max-w-3xl">
        <SectionHeading
          id="product-heading"
          eyebrow="The product"
          title="Long-term direction, tied to daily work."
          description="Students often know where they want to go but struggle to know what to study, in what order, and what to do today. AI Study Future Planner is built to connect that long-term direction with daily execution."
        />
        <p className="body mt-8 max-w-2xl">
          The same goal is meant to stay visible from the roadmap to the work of
          the day, then through practice and the next revision of the plan.
        </p>
        </div>
      </Container>
    </Section>
  );
}
