import { Container } from "@/components/ui/container";

export default function AppLoading() {
  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
        <div className="h-10 w-64 max-w-full animate-pulse rounded-xl bg-line" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-line" />
        <div className="h-48 animate-pulse rounded-2xl bg-line" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-2xl bg-line" />
          <div className="h-28 animate-pulse rounded-2xl bg-line" />
          <div className="h-28 animate-pulse rounded-2xl bg-line" />
        </div>
        <span className="sr-only">Loading dashboard</span>
      </div>
    </Container>
  );
}
