import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const providerError = url.searchParams.get("error");
  const nextPath = safeNextPath(url.searchParams.get("next"));

  if (providerError || (!code && !tokenHash)) {
    return NextResponse.redirect(new URL("/login?error=callback", url.origin));
  }

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, url.origin));
    }

    return NextResponse.redirect(new URL("/login?error=callback", url.origin));
  }

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=callback", url.origin));
}

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return value === "/app" || value.startsWith("/app/") ? value : "/app";
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
