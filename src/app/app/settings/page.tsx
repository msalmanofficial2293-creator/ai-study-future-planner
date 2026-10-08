import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { SettingsPanel } from "@/features/profile/settings-panel";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { hasCompletedOnboarding } from "@/services/onboarding-status";
import { loadProfile, type ProfileLoad } from "@/services/profile";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();

  if (!(await hasCompletedOnboarding(supabase, user.id))) {
    redirect("/onboarding");
  }

  const loaded = await loadProfile();

  if (loaded.status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="flex w-full flex-col gap-6">
        <div>
          <h1 className="page-heading">Settings</h1>
          <p className="body-secondary mt-3 max-w-2xl">
            Account, notifications, learning preferences, and security—only options backed by your
            saved profile.
          </p>
        </div>
        {loaded.status === "ready" ? (
          <SettingsPanel profile={loaded.profile} />
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="field-error" role="alert">
              Error: {settingsErrorMessage(loaded)}
            </p>
            <Link href="/app/settings" className="font-medium text-accent-deep underline underline-offset-4">
              Try again
            </Link>
          </div>
        )}
      </div>
    </Container>
  );
}

function settingsErrorMessage(loaded: Exclude<ProfileLoad, { status: "unauthenticated" | "ready" }>): string {
  if (loaded.status === "missing") {
    return "Your profile is not ready yet. Please try again in a moment.";
  }

  void loaded.detail;
  return "Something went wrong. Please try again.";
}
