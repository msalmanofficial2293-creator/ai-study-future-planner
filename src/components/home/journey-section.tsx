import { journeySteps } from "@/config/home-content";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function JourneySection() {
  return (
    <section id="journey" aria-labelledby="journey-heading" className="border-b border-line bg-paper-raised">
      <Container className="py-16 sm:py-20">
        <SectionHeading
          id="journey-heading"
          eyebrow="The journey"
          title="From a goal to guided practice"
          description="The platform is organized as one sequence, so planning, study, and review stay connected to the same future."
        />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-line bg-paper p-5"
            >
              <p className="font-display text-sm text-horizon-deep">
                <span className="sr-only">Step </span>
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-xl text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.summary}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
