/**
 * Public configuration only.
 * Server-only secrets must be read in server modules in later phases,
 * and must never be added to this object or to NEXT_PUBLIC_ variables.
 */

const DEFAULT_APP_URL = "http://localhost:3000";

function readAppUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!value) {
    return DEFAULT_APP_URL;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be an absolute http(s) URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use http or https.");
  }

  return url.origin;
}

export const env = {
  appUrl: readAppUrl(),
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;
