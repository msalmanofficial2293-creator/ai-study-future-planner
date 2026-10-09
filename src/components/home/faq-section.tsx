import { faqs } from "@/config/home-content";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export function FaqSection() {
  return (
    <Section id="faq" labelledBy="faq-heading" tone="lavender">
      <Container>
        <div className="max-w-3xl">
          <SectionHeading
            id="faq-heading"
            eyebrow="FAQ"
            title="Common questions about the product."
            description="Short answers about what the planner does today, how AI features work in development mode, and how your account data is handled."
          />
          <div className="mt-10 overflow-hidden rounded-2xl border border-purple/15 bg-elevated shadow-[var(--shadow-soft)]">
            {faqs.map((item, index) => (
              <details
                key={item.question}
                className="faq-item group border-b border-border last:border-b-0"
              >
                <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 px-5 py-4 sm:px-6">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={
                        index % 3 === 0
                          ? "mt-1.5 size-2 shrink-0 rounded-full bg-purple"
                          : index % 3 === 1
                            ? "mt-1.5 size-2 shrink-0 rounded-full bg-blue"
                            : "mt-1.5 size-2 shrink-0 rounded-full bg-teal"
                      }
                      aria-hidden="true"
                    />
                    <h3 className="card-heading">{item.question}</h3>
                  </div>
                  <span className="caption shrink-0 text-purple-deep group-open:hidden" aria-hidden="true">
                    Show
                  </span>
                  <span
                    className="caption hidden shrink-0 text-purple-deep group-open:inline"
                    aria-hidden="true"
                  >
                    Hide
                  </span>
                </summary>
                <p className="body-secondary max-w-2xl px-5 pb-5 pl-10 sm:px-6 sm:pl-11">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
