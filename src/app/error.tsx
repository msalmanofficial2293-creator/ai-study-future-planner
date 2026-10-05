"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  return (
    <Container className="py-24 sm:py-32">
      <p className="text-sm font-medium tracking-[0.14em] text-tide uppercase">
        Error
      </p>
      <h1 className="mt-3 max-w-xl font-display text-4xl tracking-tight text-balance text-ink sm:text-5xl">
        This page could not be displayed.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
        Something unexpected happened while loading this view. You can try
        again.
      </p>
      {error.digest ? (
        <p className="mt-3 text-sm text-muted">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-8">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </div>
    </Container>
  );
}
