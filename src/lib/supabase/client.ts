import { createBrowserClient } from "@supabase/ssr";
import { readSupabasePublicConfig } from "@/lib/supabase/config";

/**
 * Browser Supabase client for the public URL and publishable key only.
 * Study data access stays in server services with auth.getUser() and RLS.
 * Do not pass a service-role or secret key here.
 */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = readSupabasePublicConfig();

  return createBrowserClient(url, publishableKey);
}
