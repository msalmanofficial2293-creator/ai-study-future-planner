import { NextResponse } from "next/server";
import { authDestination, hasCompletedOnboarding } from "@/services/onboarding-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const providerError = url.searchParams.get("error");

  if (providerError || (!code && !tokenHash)) {
    return NextResponse.redirect(new URL("/login?error=callback", url.origin));
  }

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(await destinationFor(supabase, data.user?.id), url.origin));
    }

    return NextResponse.redirect(new URL("/login?error=callback", url.origin));
  }

  if (tokenHash && isEmailOtpType(type)) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(await destinationFor(supabase, data.user?.id), url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=callback", url.origin));
}

async function destinationFor(
  supabase: Parameters<typeof hasCompletedOnboarding>[0],
  userId: string | undefined,
): Promise<"/app" | "/onboarding"> {
  if (!userId) {
    return "/onboarding";
  }

  return authDestination(await hasCompletedOnboarding(supabase, userId));
}

function isEmailOtpType(
  type: string | null,
): type is "signup" | "email" | "magiclink" | "recovery" | "invite" | "email_change" {
  return (
    type === "signup" ||
    type === "email" ||
    type === "magiclink" ||
    type === "recovery" ||
    type === "invite" ||
    type === "email_change"
  );
}
