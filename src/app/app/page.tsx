import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/auth-panel";
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
      footer="This page confirms you are signed in. Study plans are not available yet."
    >
      {signOutError ? (
        <p className="field-error" role="alert">
          Error: {signOutError}
        </p>
      ) : null}
      <p className="body-secondary">
        Signed in as <span className="font-medium">{user.email}</span>
      </p>
      <div className="mt-8">
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
