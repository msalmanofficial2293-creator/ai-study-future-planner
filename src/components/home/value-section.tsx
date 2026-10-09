import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export function ValueSection() {
  return (
    <Section id="product" labelledBy="product-heading" tone="raised">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-stretch lg:gap-12">
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
          <aside
            aria-label="Journey stages overview"
            className="flex flex-col justify-center gap-3 rounded-2xl border border-purple/15 bg-gradient-to-br from-soft-lavender via-elevated to-soft-blue p-5 shadow-[var(--shadow-soft)] sm:p-6"
          >
            <p className="eyebrow text-purple-deep">Connected stages</p>
            <ul className="mt-1 flex flex-col gap-2.5">
              {[
                { label: "Plan", tint: "bg-purple" },
                { label: "Study", tint: "bg-blue" },
                { label: "Practice", tint: "bg-teal" },
                { label: "Improve", tint: "bg-emerald" },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-border/80 bg-elevated/90 px-3.5 py-2.5"
                >
                  <span className={`size-2.5 shrink-0 rounded-full ${item.tint}`} aria-hidden="true" />
                  <span className="text-sm font-medium text-ink">{item.label}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
