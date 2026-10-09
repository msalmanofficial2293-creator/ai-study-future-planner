import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isUserEmailVerified } from "@/features/auth/email-status";
import {
  hasSupabasePublicConfig,
  readSupabasePublicConfig,
} from "@/lib/supabase/config";
import { hasSupabaseSessionCookie } from "@/lib/supabase/cookies";
import { authDestination, hasCompletedOnboarding } from "@/services/onboarding-status";

const AUTH_ROUTES = new Set(["/login", "/signup"]);
const VERIFY_EMAIL_PATH = "/verify-email";

export async function updateSession(request: NextRequest) {
  let response = passthroughWithPath(request);

  if (!hasSupabasePublicConfig()) {
    return response;
  }

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/");
  const isAuthRoute = AUTH_ROUTES.has(pathname);
  const isVerifyEmailRoute =
    pathname === VERIFY_EMAIL_PATH || pathname.startsWith(`${VERIFY_EMAIL_PATH}/`);
  const isServerAction = request.headers.has("next-action");

  if (!hasSupabaseSessionCookie(request.cookies.getAll())) {
    if (!isServerAction && isProtected) {
      return redirectWithSession(request, response, "/login");
    }

    return response;
  }

  if (isServerAction) {
    return response;
  }

  const { url, publishableKey } = readSupabasePublicConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = passthroughWithPath(request);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    return redirectWithSession(request, response, "/login");
  }

  if (user && !isUserEmailVerified(user)) {
    if (isProtected) {
      return redirectWithSession(request, response, VERIFY_EMAIL_PATH);
    }

    if (isAuthRoute) {
      return redirectWithSession(request, response, VERIFY_EMAIL_PATH);
    }

    return response;
  }

  if (user && isUserEmailVerified(user) && (isAuthRoute || isVerifyEmailRoute)) {
    const completed = await hasCompletedOnboarding(supabase, user.id);
    return redirectWithSession(request, response, authDestination(completed));
  }

  return response;
}

function passthroughWithPath(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function redirectWithSession(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";
  const redirectResponse = NextResponse.redirect(redirectUrl);

  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
