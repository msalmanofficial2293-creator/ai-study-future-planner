import { Container } from "@/components/ui/container";

export default function AppLoading() {
  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
        <div className="max-w-3xl space-y-3">
          <div className="h-3 w-24 animate-pulse rounded-full bg-line" />
          <div className="h-10 w-72 max-w-full animate-pulse rounded-xl bg-line" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-line" />
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="h-8 w-40 animate-pulse rounded-full bg-line" />
            <div className="h-8 w-32 animate-pulse rounded-full bg-line" />
            <div className="h-8 w-48 animate-pulse rounded-full bg-line" />
          </div>
        </div>

        <div className="h-52 animate-pulse rounded-2xl bg-line" />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="h-28 animate-pulse rounded-2xl bg-line" />
          <div className="h-28 animate-pulse rounded-2xl bg-line" />
          <div className="h-28 animate-pulse rounded-2xl bg-line" />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-line" />
          <div className="h-64 animate-pulse rounded-2xl bg-line" />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-56 animate-pulse rounded-2xl bg-line" />
          <div className="h-56 animate-pulse rounded-2xl bg-line" />
        </div>

        <span className="sr-only">Loading dashboard</span>
      </div>
    </Container>
  );
}
