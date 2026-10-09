import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/auth-panel";
import { isUserEmailVerified } from "@/features/auth/email-status";
import { authMessages } from "@/features/auth/messages";
import { ResendVerificationForm } from "@/features/auth/resend-verification-form";
import { LogoutButton } from "@/features/auth/logout-button";
import { authDestination, hasCompletedOnboarding } from "@/services/onboarding-status";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage() {
  const user = await getSessionUser();

  if (user && isUserEmailVerified(user)) {
    const supabase = await createSupabaseServerClient();
    redirect(authDestination(await hasCompletedOnboarding(supabase, user.id)));
  }

  return (
    <AuthPanel
      title="Verify your email"
      description={authMessages.confirmEmail}
      footer={
        <>
          Already verified?{" "}
          <Link href="/login" className="text-link">
            Log in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <p className="body-secondary">
          Protected study tools stay locked until your email is confirmed and you have a valid
          signed-in session.
        </p>
        <ResendVerificationForm initialEmail={user?.email ?? ""} />
        {user ? (
          <div className="border-t border-border pt-4">
            <p className="caption mb-3">Signed in with an unverified address. You can sign out and try again later.</p>
            <LogoutButton />
          </div>
        ) : null}
      </div>
    </AuthPanel>
  );
}
