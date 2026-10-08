import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { DashboardViewPanel } from "@/features/dashboard/dashboard-view";
import { authMessages } from "@/features/auth/messages";
import { loadDashboard } from "@/services/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

type DashboardPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const loaded = await loadDashboard();

  if (loaded.status === "unauthenticated") {
    redirect("/login");
  }

  const params = await searchParams;
  const signOutError = params.error === "signout" ? authMessages.unexpected : undefined;

  if (loaded.status === "unavailable") {
    return (
      <Container className="py-8 sm:py-10">
        <section className="card card-elevated max-w-xl" aria-labelledby="dashboard-error-heading">
          <p className="eyebrow">Dashboard</p>
          <h1 id="dashboard-error-heading" className="card-heading mt-2">
            Unable to load your learning dashboard
          </h1>
          <p className="body-secondary mt-3">
            Something went wrong while loading your study data. Please try again in a moment.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/app">Try Again</Button>
            <Link
              href="/app/profile"
              className="inline-flex items-center text-sm font-medium text-accent-deep underline underline-offset-4"
            >
              Open profile
            </Link>
          </div>
        </section>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-10">
      <DashboardViewPanel dashboard={loaded.dashboard} signOutError={signOutError} />
    </Container>
  );
}
