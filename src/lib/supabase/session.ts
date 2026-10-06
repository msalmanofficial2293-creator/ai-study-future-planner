import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  hasSupabasePublicConfig,
  readSupabasePublicConfig,
} from "@/lib/supabase/config";
import { hasSupabaseSessionCookie } from "@/lib/supabase/cookies";

const AUTH_ROUTES = new Set(["/login", "/signup"]);

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

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
        response = NextResponse.next({ request });
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

  if (user && isAuthRoute) {
    return redirectWithSession(request, response, "/app");
  }

  return response;
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
