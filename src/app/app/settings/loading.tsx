import { Container } from "@/components/ui/container";

export default function SettingsLoading() {
  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
        <div className="max-w-3xl space-y-3">
          <div className="h-10 w-40 max-w-full animate-pulse rounded-xl bg-line" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-line" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <div className="hidden space-y-2 lg:block">
            <div className="h-9 animate-pulse rounded-lg bg-line" />
            <div className="h-9 animate-pulse rounded-lg bg-line" />
            <div className="h-9 animate-pulse rounded-lg bg-line" />
            <div className="h-9 animate-pulse rounded-lg bg-line" />
          </div>
          <div className="flex flex-col gap-6">
            <div className="h-44 animate-pulse rounded-2xl bg-line" />
            <div className="h-52 animate-pulse rounded-2xl bg-line" />
            <div className="h-64 animate-pulse rounded-2xl bg-line" />
            <div className="h-48 animate-pulse rounded-2xl bg-line" />
          </div>
        </div>
        <span className="sr-only">Loading settings</span>
      </div>
    </Container>
  );
}
