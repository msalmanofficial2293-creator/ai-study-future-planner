import { AppPage } from "@/components/ui/app-page";

export default function AppLoading() {
  return (
    <AppPage scene="dashboard">
      <div aria-busy="true" aria-live="polite">
        <div className="page-header space-y-3">
          <div className="h-3 w-24 animate-pulse rounded-full bg-line" />
          <div className="h-10 w-72 max-w-full animate-pulse rounded-[var(--radius-control)] bg-line" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-line" />
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="h-8 w-40 animate-pulse rounded-full bg-line" />
            <div className="h-8 w-32 animate-pulse rounded-full bg-line" />
            <div className="h-8 w-48 animate-pulse rounded-full bg-line" />
          </div>
        </div>

        <div className="mt-8 h-52 animate-pulse rounded-[var(--radius-card)] bg-line" />

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="h-28 animate-pulse rounded-[var(--radius-card)] bg-line" />
          <div className="h-28 animate-pulse rounded-[var(--radius-card)] bg-line" />
          <div className="h-28 animate-pulse rounded-[var(--radius-card)] bg-line" />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-line" />
          <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-line" />
        </div>

        <span className="sr-only">Loading dashboard</span>
      </div>
    </AppPage>
  );
}
