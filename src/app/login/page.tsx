import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/auth-panel";
import { isUserEmailVerified } from "@/features/auth/email-status";
import { loginInitialError } from "@/features/auth/messages";
import { LoginForm } from "@/features/auth/login-form";
import { authDestination, hasCompletedOnboarding } from "@/services/onboarding-status";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();

  if (user && isUserEmailVerified(user)) {
    const supabase = await createSupabaseServerClient();
    redirect(authDestination(await hasCompletedOnboarding(supabase, user.id)));
  }

  if (user && !isUserEmailVerified(user)) {
    redirect("/verify-email");
  }

  const params = await searchParams;
  const initialError = loginInitialError(params.error);
  const showResend =
    params.error === "callback" ||
    params.error === "expired" ||
    params.error === "unverified";

  return (
    <AuthPanel
      title="Welcome back"
      description="Sign in to continue your learning journey."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-link">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm initialError={initialError} showResend={showResend} />
    </AuthPanel>
  );
}
