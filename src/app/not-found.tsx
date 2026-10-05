import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="py-24 sm:py-32">
      <p className="text-sm font-medium tracking-[0.14em] text-tide uppercase">
        404
      </p>
      <h1 className="mt-3 max-w-xl font-display text-4xl tracking-tight text-balance text-ink sm:text-5xl">
        This page is not on the path.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
        The address does not match a page in AI Study Future Planner.
      </p>
      <div className="mt-8">
        <Button href="/">Back to home</Button>
      </div>
    </Container>
  );
}
