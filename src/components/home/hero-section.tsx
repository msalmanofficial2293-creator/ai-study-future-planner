import { journeySteps } from "@/config/home-content";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="border-b border-line">
      <Container className="grid items-end gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:py-28">
        <div>
          <p className="text-sm font-medium tracking-[0.14em] text-tide uppercase">
            Student learning, with a destination
          </p>
          <div
            aria-hidden="true"
            className="mt-5 h-px w-16 bg-horizon"
          />
          <h1
            id="hero-heading"
            className="mt-5 max-w-xl font-display text-4xl leading-tight tracking-tight text-balance text-ink sm:text-5xl lg:text-6xl"
          >
            Name the future you are studying for.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            AI Study Future Planner helps students turn one serious goal into a
            learning journey: a roadmap, a study plan, daily work, practice, and
            a path that can adapt as they improve.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="#journey" className="w-full sm:w-auto">
              View the journey
            </Button>
            <Button
              href="#approach"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              How it is shaped
            </Button>
          </div>
        </div>
        <aside
          aria-labelledby="sequence-heading"
          className="rounded-3xl border border-line bg-paper-raised p-6 shadow-[0_24px_50px_-36px_rgba(16,32,51,0.7)] sm:p-7"
        >
          <h2 id="sequence-heading" className="font-display text-2xl text-ink">
            The sequence
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            One path, from the goal you choose to the guidance that follows.
          </p>
          <ol className="mt-6 border-l border-line">
            {journeySteps.map((step, index) => (
              <li key={step.title} className="relative py-1.5 pl-5">
                <span
                  aria-hidden="true"
                  className={
                    index === 0
                      ? "absolute top-3 -left-[5px] size-2.5 rounded-full bg-horizon"
                      : "absolute top-3.5 -left-[4px] size-2 rounded-full bg-tide"
                  }
                />
                <span className="sr-only">Step {index + 1}: </span>
                <span className="text-sm font-medium text-ink">{step.title}</span>
              </li>
            ))}
          </ol>
        </aside>
      </Container>
    </section>
  );
}
