import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isUserEmailVerified } from "@/features/auth/email-status";
import {
  hasSupabasePublicConfig,
  readSupabasePublicConfig,
} from "@/lib/supabase/config";
import { hasSupabaseSessionCookie } from "@/lib/supabase/cookies";

export async function createSupabaseServerClient() {
  const { url, publishableKey } = readSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. The proxy refreshes the session.
        }
      },
    },
  });
}

/**
 * Session user from Auth cookies via `getUser()` (not `getSession()` alone).
 * Does not require a verified email — use for login/signup/verify-email routing.
 */
export async function getSessionUser(): Promise<User | null> {
  if (!hasSupabasePublicConfig()) {
    return null;
  }

  const cookieStore = await cookies();

  if (!hasSupabaseSessionCookie(cookieStore.getAll())) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

/**
 * Authenticated student allowed into protected app routes.
 * Requires a valid Auth user with a verified email address.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const user = await getSessionUser();

  if (!user || !isUserEmailVerified(user)) {
    return null;
  }

  return user;
}
