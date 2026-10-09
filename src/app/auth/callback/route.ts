import { NextResponse } from "next/server";
import { isUserEmailVerified } from "@/features/auth/email-status";
import { authDestination, hasCompletedOnboarding } from "@/services/onboarding-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const providerError = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");

  if (providerError || (!code && !tokenHash)) {
    return NextResponse.redirect(new URL(callbackFailurePath(errorCode, errorDescription), url.origin));
  }

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (!isUserEmailVerified(data.user)) {
        return NextResponse.redirect(new URL("/verify-email", url.origin));
      }

      return NextResponse.redirect(
        new URL(await destinationFor(supabase, data.user.id), url.origin),
      );
    }

    return NextResponse.redirect(new URL(callbackFailurePath(error?.code, error?.message), url.origin));
  }

  if (tokenHash && isEmailOtpType(type)) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error && data.user) {
      if (!isUserEmailVerified(data.user)) {
        return NextResponse.redirect(new URL("/verify-email", url.origin));
      }

      return NextResponse.redirect(
        new URL(await destinationFor(supabase, data.user.id), url.origin),
      );
    }

    return NextResponse.redirect(new URL(callbackFailurePath(error?.code, error?.message), url.origin));
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

function callbackFailurePath(code?: string | null, message?: string | null): string {
  const haystack = `${code ?? ""} ${message ?? ""}`.toLowerCase();

  if (
    haystack.includes("expired") ||
    haystack.includes("otp_expired") ||
    haystack.includes("flow_state_expired")
  ) {
    return "/login?error=expired";
  }

  return "/login?error=callback";
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
