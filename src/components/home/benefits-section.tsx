import { benefits } from "@/config/home-content";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";

const BENEFIT_ACCENTS = [
  { index: "text-emerald", bar: "bg-emerald" },
  { index: "text-blue-deep", bar: "bg-blue" },
  { index: "text-purple-deep", bar: "bg-purple" },
  { index: "text-teal", bar: "bg-teal" },
] as const;

export function BenefitsSection() {
  return (
    <Section id="benefits" labelledBy="benefits-heading" tone="mint">
      <Container>
        <SectionHeading
          id="benefits-heading"
          eyebrow="For students"
          title="What a clear path helps you do."
          description="These outcomes describe how the current product is meant to support study. They are not claims about measured results from other users."
        />
        <ol className="mt-12 overflow-hidden rounded-2xl border border-teal/20 bg-elevated shadow-[var(--shadow-soft)]">
          {benefits.map((benefit, index) => {
            const accent = BENEFIT_ACCENTS[index % BENEFIT_ACCENTS.length] ?? BENEFIT_ACCENTS[0];
            return (
              <li
                key={benefit.title}
                className={cn(
                  "grid gap-2 border-b border-border/80 px-5 py-6 last:border-b-0 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-8 sm:px-7 sm:py-7",
                  index % 2 === 0
                    ? "bg-gradient-to-r from-soft-mint/50 to-elevated"
                    : "bg-gradient-to-r from-soft-blue/40 to-elevated",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn("mt-1.5 h-8 w-1 shrink-0 rounded-full", accent.bar)}
                    aria-hidden="true"
                  />
                  <p className={cn("index-label", accent.index)}>
                    <span className="sr-only">Benefit </span>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                </div>
                <div>
                  <h3 className="card-heading">{benefit.title}</h3>
                  <p className="body-secondary mt-2 max-w-2xl">{benefit.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}
