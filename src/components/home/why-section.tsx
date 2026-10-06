import { reasons } from "@/config/home-content";
import { Container } from "@/components/ui/container";
import { Divider } from "@/components/ui/divider";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export function WhySection() {
  return (
    <Section id="why" labelledBy="why-heading" tone="plain">
      <Container>
        <SectionHeading
          id="why-heading"
          eyebrow="Why this path"
          title="One journey, instead of scattered study tools."
          description="The product is shaped around a few choices. It does not claim to replace every study method, and it is not presented as the only way to learn."
        />
        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, index) => (
            <li key={reason.title}>
              <Divider />
              <p className="index-label mt-4">
                <span className="sr-only">Point </span>
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="principle-heading mt-2">{reason.title}</h3>
              <p className="body-secondary mt-3">{reason.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
