/**
 * Public Supabase values only.
 * The publishable key is designed for the browser. Never read a secret
 * or service-role key in this module.
 */

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export function hasSupabasePublicConfig(): boolean {
  return readOptionalSupabasePublicConfig() !== null;
}

export function readSupabasePublicConfig(): SupabasePublicConfig {
  const config = readOptionalSupabasePublicConfig();

  if (!config) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set.",
    );
  }

  return config;
}

function readOptionalSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  if (!url || !publishableKey) {
    return null;
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be an absolute https URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must use https.");
  }

  return {
    url: parsed.origin,
    publishableKey,
  };
}
