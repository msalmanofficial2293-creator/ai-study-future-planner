import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppPage } from "@/components/ui/app-page";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileEditor } from "@/features/profile/profile-editor";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { hasCompletedOnboarding } from "@/services/onboarding-status";
import { loadProfile, type ProfileLoad } from "@/services/profile";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
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
    <AppPage dense>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Manage your personal information, learning preferences, goals, and account."
      />
      {loaded.status === "ready" ? (
        <ProfileEditor profile={loaded.profile} />
      ) : (
        <div className="flex flex-col items-start gap-4">
          <p className="field-error" role="alert">
            Error: {profileErrorMessage(loaded)}
          </p>
          <Link href="/app/profile" className="text-link">
            Try again
          </Link>
        </div>
      )}
    </AppPage>
  );
}

function profileErrorMessage(loaded: Exclude<ProfileLoad, { status: "unauthenticated" | "ready" }>): string {
  if (loaded.status === "missing") {
    return "Your profile is not ready yet. Please try again in a moment.";
  }

  void loaded.detail;
  return "Something went wrong. Please try again.";
}
