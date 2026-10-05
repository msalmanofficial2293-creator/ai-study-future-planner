import { principles } from "@/config/home-content";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function ApproachSection() {
  return (
    <section id="approach" aria-labelledby="approach-heading">
      <Container className="py-16 sm:py-20">
        <SectionHeading
          id="approach-heading"
          eyebrow="The approach"
          title="Built for students who want direction"
          description="The product favors a calm, structured path over a pile of disconnected tools."
        />
        <ol className="mt-12 grid gap-6 lg:grid-cols-3">
          {principles.map((principle, index) => (
            <li key={principle.title} className="border-t border-line pt-5">
              <p className="text-sm font-medium text-horizon-deep">
                <span className="sr-only">Principle </span>
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-2xl text-ink">
                {principle.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted">
                {principle.body}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
