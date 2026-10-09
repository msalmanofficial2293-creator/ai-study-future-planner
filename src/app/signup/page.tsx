import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/auth-panel";
import { isUserEmailVerified } from "@/features/auth/email-status";
import { SignupForm } from "@/features/auth/signup-form";
import { authDestination, hasCompletedOnboarding } from "@/services/onboarding-status";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default async function SignupPage() {
  const user = await getSessionUser();

  if (user && isUserEmailVerified(user)) {
    const supabase = await createSupabaseServerClient();
    redirect(authDestination(await hasCompletedOnboarding(supabase, user.id)));
  }

  if (user && !isUserEmailVerified(user)) {
    redirect("/verify-email");
  }

  return (
    <AuthPanel
      title="Create your account"
      description="Start building your personalized learning journey."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-link">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthPanel>
  );
}
