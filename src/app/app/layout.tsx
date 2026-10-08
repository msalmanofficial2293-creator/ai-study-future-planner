import { redirect } from "next/navigation";
import { AppShell } from "@/features/app-shell/app-shell";
import type { AppShellUser } from "@/features/app-shell/nav";
import { profileInitials } from "@/features/profile/validation";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { hasCompletedOnboarding } from "@/services/onboarding-status";

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();

  if (!user?.email) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();

  if (!(await hasCompletedOnboarding(supabase, user.id))) {
    redirect("/onboarding");
  }

  const profileResult = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    typeof profileResult.data?.full_name === "string" && profileResult.data.full_name.trim()
      ? profileResult.data.full_name.trim()
      : readFullName(user.user_metadata) ?? "";

  const shellUser: AppShellUser = {
    fullName: fullName || "Learner",
    firstName: firstName(fullName),
    email: user.email,
    initials: profileInitials(fullName || user.email),
  };

  return <AppShell user={shellUser}>{children}</AppShell>;
}

function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/).filter(Boolean)[0];
  return part || "there";
}

function readFullName(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || !("full_name" in metadata)) {
    return null;
  }

  const value = metadata.full_name;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
