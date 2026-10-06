import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

export async function getAuthenticatedUser() {
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
