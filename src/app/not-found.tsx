import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="py-24 sm:py-32">
      <p className="eyebrow">404</p>
      <h1 className="page-heading mt-3 max-w-xl">This page is not on the path.</h1>
      <p className="body-secondary mt-4 max-w-xl">
        The address does not match a page in AI Study Future Planner.
      </p>
      <div className="mt-8">
        <Button href="/">Back to home</Button>
      </div>
    </Container>
  );
}
