import { reasons } from "@/config/home-content";
import { Container } from "@/components/ui/container";
import { Divider } from "@/components/ui/divider";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";

const REASON_ACCENTS = [
  "text-[#c4b5fd]",
  "text-[#93c5fd]",
  "text-[#5eead4]",
] as const;

export function WhySection() {
  return (
    <Section id="why" labelledBy="why-heading" tone="navy">
      <Container>
        <SectionHeading
          id="why-heading"
          eyebrow="Why this path"
          title="One journey, instead of scattered study tools."
          description="The product is shaped around a few choices. It does not claim to replace every study method, and it is not presented as the only way to learn."
        />
        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, index) => (
            <li
              key={reason.title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
            >
              <Divider className="border-white/20" />
              <p
                className={cn(
                  "index-label mt-4",
                  REASON_ACCENTS[index % REASON_ACCENTS.length],
                )}
              >
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
