import { createBrowserClient } from "@supabase/ssr";
import { readSupabasePublicConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = readSupabasePublicConfig();

  return createBrowserClient(url, publishableKey);
}
