import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ProfileEditor } from "@/features/profile/profile-editor";
import { loadProfile, type ProfileLoad } from "@/services/profile";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const loaded = await loadProfile();

  if (loaded.status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="page-heading mt-3">Profile</h1>
          <p className="body-secondary mt-3 max-w-2xl">
            Your identity, learning context, and goal. Email stays with your account.
          </p>
        </div>
        {loaded.status === "ready" ? (
          <ProfileEditor profile={loaded.profile} />
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="field-error" role="alert">
              Error: {profileErrorMessage(loaded)}
            </p>
            <Link href="/app/profile" className="font-medium text-accent-deep underline underline-offset-4">
              Try again
            </Link>
          </div>
        )}
      </div>
    </Container>
  );
}

function profileErrorMessage(loaded: Exclude<ProfileLoad, { status: "unauthenticated" | "ready" }>): string {
  if (loaded.status === "missing") {
    return "Your profile is not ready yet. Please try again in a moment.";
  }

  void loaded.detail;
  return "Something went wrong. Please try again.";
}
