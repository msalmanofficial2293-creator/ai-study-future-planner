import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
        <div className="flex flex-col items-start gap-4">
          <h1 className="page-heading">Dashboard</h1>
          <p className="field-error" role="alert">
            Error: Something went wrong loading your dashboard. Please try again.
          </p>
          <Link href="/app" className="font-medium text-accent-deep underline underline-offset-4">
            Try again
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-10">
      <DashboardViewPanel dashboard={loaded.dashboard} signOutError={signOutError} />
    </Container>
  );
}
