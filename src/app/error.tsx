"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ErrorState } from "@/components/ui/feedback";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  return (
    <Container className="py-24 sm:py-32">
      <ErrorState
        title="This page could not be displayed."
        description="Something unexpected happened while loading this view. You can try again."
        reference={error.digest}
        action={
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        }
      />
    </Container>
  );
}
