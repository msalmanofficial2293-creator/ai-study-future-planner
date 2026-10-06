import { benefits } from "@/config/home-content";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export function BenefitsSection() {
  return (
    <Section id="benefits" labelledBy="benefits-heading">
      <Container>
        <SectionHeading
          id="benefits-heading"
          eyebrow="For students"
          title="What a clear path is meant to change."
          description="These are the outcomes the journey is designed to support. They describe intent, not measured results from people using the product."
        />
        <ol className="mt-12 divide-y divide-border border-y border-border">
          {benefits.map((benefit, index) => (
            <li
              key={benefit.title}
              className="grid gap-2 py-6 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-8 sm:py-7"
            >
              <p className="index-label">
                <span className="sr-only">Benefit </span>
                {String(index + 1).padStart(2, "0")}
              </p>
              <div>
                <h3 className="card-heading">{benefit.title}</h3>
                <p className="body-secondary mt-2 max-w-2xl">{benefit.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
