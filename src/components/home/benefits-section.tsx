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
          title="What a clear path helps you do."
          description="These outcomes describe how the current product is meant to support study. They are not claims about measured results from other users."
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
