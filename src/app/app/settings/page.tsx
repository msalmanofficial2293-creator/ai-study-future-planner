import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppPage } from "@/components/ui/app-page";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
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
    <AppPage scene="settings">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your account, preferences, security, and learning experience."
      />
      {loaded.status === "ready" ? (
        <SettingsPanel profile={loaded.profile} />
      ) : (
        <section className="card card-elevated max-w-xl" aria-labelledby="settings-error-heading">
          <h2 id="settings-error-heading" className="card-heading">
            Unable to load settings
          </h2>
          <p className="body-secondary mt-3">{settingsErrorMessage(loaded)}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/app/settings">Try Again</Button>
            <Link href="/app/profile" className="text-link inline-flex items-center">
              Open profile
            </Link>
          </div>
        </section>
      )}
    </AppPage>
  );
}

function settingsErrorMessage(
  loaded: Exclude<ProfileLoad, { status: "unauthenticated" | "ready" }>,
): string {
  if (loaded.status === "missing") {
    return "Your profile is not ready yet. Please try again in a moment.";
  }

  void loaded.detail;
  return "Something went wrong while loading your account settings. Please try again.";
}
