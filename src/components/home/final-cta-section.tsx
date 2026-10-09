import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export function FinalCtaSection() {
  return (
    <Section id="start" labelledBy="start-heading" tone="cta">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-start rounded-2xl border border-white/15 bg-white/[0.06] p-6 text-left shadow-[var(--shadow-soft)] sm:items-center sm:p-10 sm:text-center">
          <p className="eyebrow">Next step</p>
          <h2 id="start-heading" className="section-heading mt-3 max-w-xl">
            Ready to turn your goal into a real study plan?
          </h2>
          <p className="body-secondary mt-4 max-w-xl">
            Create your account and start building a structured learning path
            around your goals—roadmap, daily work, practice, progress, and
            guidance in one place.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button href="/signup" className="w-full bg-white text-purple-deep hover:bg-soft-lavender sm:w-auto">
              Start Planning
            </Button>
            <Button href="/login" variant="secondary" className="w-full sm:w-auto">
              Sign In
            </Button>
          </div>
          <p className="caption mt-4 max-w-xl">
            No payment is required on this site today. After signup you complete
            a short onboarding profile, then open your account tools.
          </p>
        </div>
      </Container>
    </Section>
  );
}
