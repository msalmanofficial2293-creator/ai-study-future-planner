import { faqs } from "@/config/home-content";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export function FaqSection() {
  return (
    <Section id="faq" labelledBy="faq-heading" tone="raised">
      <Container>
        <div className="max-w-3xl">
        <SectionHeading
          id="faq-heading"
          eyebrow="FAQ"
          title="Questions before a plan exists."
          description="Short answers about what this site is, and what is still on the product roadmap."
        />
        <div className="mt-10 border-t border-border">
          {faqs.map((item) => (
            <details key={item.question} className="faq-item group border-b border-border">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-4">
                <h3 className="card-heading">{item.question}</h3>
                <span className="caption shrink-0 group-open:hidden" aria-hidden="true">
                  Show
                </span>
                <span
                  className="caption hidden shrink-0 group-open:inline"
                  aria-hidden="true"
                >
                  Hide
                </span>
              </summary>
              <p className="body-secondary max-w-2xl pb-5">{item.answer}</p>
            </details>
          ))}
        </div>
        </div>
      </Container>
    </Section>
  );
}
