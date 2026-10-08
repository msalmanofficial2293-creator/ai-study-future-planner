import { Container } from "@/components/ui/container";

export default function SettingsLoading() {
  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
        <div className="h-10 w-40 max-w-full animate-pulse rounded-xl bg-line" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-line" />
        <div className="h-40 animate-pulse rounded-2xl bg-line" />
        <div className="h-56 animate-pulse rounded-2xl bg-line" />
        <span className="sr-only">Loading settings</span>
      </div>
    </Container>
  );
}
