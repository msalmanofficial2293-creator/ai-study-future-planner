import type { User } from "@supabase/supabase-js";

/** User metadata key set on signup; cleared only after a successful /auth/callback. */
export const EMAIL_VERIFICATION_REQUIRED_KEY = "email_verification_required";

/** Normalize emails for signup/login so case variants map to one Auth identity. */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Server-side gate for protected app access.
 *
 * - Requires Supabase `email_confirmed_at` (Confirm email must be enabled in the Dashboard
 *   or Auth marks addresses verified immediately and no confirmation email is sent).
 * - Also requires that app metadata `email_verification_required` is not still `true`.
 *   That flag is set on signup and cleared only after the verification callback succeeds,
 *   so a Dashboard misconfiguration cannot silently drop users into `/app` from signup.
 */
export function isUserEmailVerified(user: User): boolean {
  if (!user.email_confirmed_at) {
    return false;
  }

  if (user.user_metadata?.[EMAIL_VERIFICATION_REQUIRED_KEY] === true) {
    return false;
  }

  return true;
}

export function hasPendingAppEmailVerification(user: User): boolean {
  return user.user_metadata?.[EMAIL_VERIFICATION_REQUIRED_KEY] === true;
}
