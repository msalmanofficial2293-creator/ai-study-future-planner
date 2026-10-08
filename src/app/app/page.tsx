import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/auth-panel";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { authMessages } from "@/features/auth/messages";
import { LogoutButton } from "@/features/auth/logout-button";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

type AccountPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await getAuthenticatedUser();

  if (!user?.email) {
    redirect("/login");
  }

  const params = await searchParams;
  const signOutError = params.error === "signout" ? authMessages.unexpected : undefined;

  const fullName = readFullName(user.user_metadata);

  return (
    <AuthPanel
      title={siteConfig.name}
      description={fullName ? `Welcome, ${fullName}.` : "Welcome."}
      footer="This page confirms you are signed in."
    >
      {signOutError ? (
        <p className="field-error" role="alert">
          Error: {signOutError}
        </p>
      ) : null}
      <p className="body-secondary">
        Signed in as <span className="font-medium">{user.email}</span>
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Button href="/app/profile" variant="secondary">
          Profile
        </Button>
        <Button href="/app/future-planner">Open Future Planner</Button>
        <Button href="/app/study-plan" variant="secondary">
          Open Study Plan
        </Button>
        <Button href="/app/daily-tasks" variant="secondary">
          Open Daily Tasks
        </Button>
        <Button href="/app/quiz" variant="secondary">
          Open AI Quiz
        </Button>
        <Button href="/app/performance" variant="secondary">
          Open Performance
        </Button>
        <Button href="/app/adaptive-plan" variant="secondary">
          Open Adaptive Study Plan
        </Button>
        <Button href="/app/ai-tutor" variant="secondary">
          Open AI Tutor
        </Button>
        <Button href="/app/personalization" variant="secondary">
          Open Personalization
        </Button>
        <LogoutButton />
      </div>
    </AuthPanel>
  );
}

function readFullName(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || !("full_name" in metadata)) {
    return null;
  }

  const value = metadata.full_name;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
