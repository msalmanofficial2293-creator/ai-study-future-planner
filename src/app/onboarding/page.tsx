import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mark } from "@/components/brand/mark";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { OnboardingForm } from "@/features/onboarding/onboarding-form";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { loadOnboarding } from "@/services/onboarding";

export const metadata: Metadata = {
  title: "Onboarding",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const loaded = await loadOnboarding(readFullName(user.user_metadata));

  if (loaded.status === "completed") {
    redirect("/app");
  }

  return (
    <Container className="flex flex-1 items-center py-12 sm:py-16">
      <Card variant="elevated" className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex min-w-0 items-center gap-3 rounded-full"
          aria-label={`${siteConfig.name}, home`}
        >
          <Mark className="size-9 shrink-0" />
          <span className="nav-brand">{siteConfig.name}</span>
        </Link>
        <h1 className="page-heading mt-6">Start with your goal</h1>
        <p className="body-secondary mt-3">
          Tell us where you are studying from and the future you want to reach. This
          becomes your first Goal.
        </p>
        <div className="mt-8">
          {loaded.status === "unavailable" ? (
            <div className="flex flex-col items-start gap-4">
              <p className="field-error" role="alert">
                Error: Something went wrong. Please try again.
              </p>
              <Link
                href="/onboarding"
                className="font-medium text-accent-deep underline underline-offset-4"
              >
                Try again
              </Link>
            </div>
          ) : (
            <OnboardingForm draft={loaded.draft} />
          )}
        </div>
      </Card>
    </Container>
  );
}

function readFullName(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || !("full_name" in metadata)) {
    return "";
  }

  const value = metadata.full_name;
  return typeof value === "string" ? value.trim() : "";
}
