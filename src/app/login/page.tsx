import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/auth-panel";
import { authMessages } from "@/features/auth/messages";
import { LoginForm } from "@/features/auth/login-form";
import { getAuthenticatedUser } from "@/lib/supabase/server";

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
    redirect("/app");
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
          <Link href="/signup" className="font-medium text-accent-deep underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm initialError={initialError} />
    </AuthPanel>
  );
}
