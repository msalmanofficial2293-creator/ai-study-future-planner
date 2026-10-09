import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/auth-panel";
import { authMessages } from "@/features/auth/messages";
import { LoginForm } from "@/features/auth/login-form";
import { authDestination, hasCompletedOnboarding } from "@/services/onboarding-status";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getAuthenticatedUser();

  if (user) {
    const supabase = await createSupabaseServerClient();
    redirect(authDestination(await hasCompletedOnboarding(supabase, user.id)));
  }

  const params = await searchParams;
  const initialError =
    params.error === "callback"
      ? authMessages.callbackError
      : params.error === "signout"
        ? authMessages.unexpected
        : undefined;

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
      <LoginForm initialError={initialError} />
    </AuthPanel>
  );
}
