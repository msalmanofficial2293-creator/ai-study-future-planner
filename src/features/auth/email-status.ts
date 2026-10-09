import type { User } from "@supabase/supabase-js";

/** Normalize emails for signup/login so case variants map to one Auth identity. */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Supabase sets `email_confirmed_at` when the address is verified
 * (or immediately when Confirm email is disabled in the project).
 */
export function isUserEmailVerified(user: User): boolean {
  return Boolean(user.email_confirmed_at);
}
