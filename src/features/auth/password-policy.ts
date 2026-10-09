/**
 * Strong password policy for signup (and shared server validation).
 * Aligns with Supabase Auth “digits, lower and uppercase letters, and symbols”.
 * Never log or return the password value from these helpers.
 */

export const PASSWORD_MIN_LENGTH = 8;

/** Matches Supabase Auth symbol set for password requirements. */
export const PASSWORD_SPECIAL_PATTERN =
  /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/;

export type PasswordRequirementId =
  | "length"
  | "uppercase"
  | "lowercase"
  | "digit"
  | "special";

export type PasswordRequirementStatus = {
  id: PasswordRequirementId;
  label: string;
  met: boolean;
};

const REQUIREMENT_MESSAGES: Record<PasswordRequirementId, string> = {
  length: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  uppercase: "Password must include at least one uppercase letter (A–Z).",
  lowercase: "Password must include at least one lowercase letter (a–z).",
  digit: "Password must include at least one digit (0–9).",
  special:
    "Password must include at least one special character (for example ! @ # $ % ^ & *).",
};

export function evaluatePasswordRequirements(
  password: string,
): PasswordRequirementStatus[] {
  return [
    {
      id: "length",
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: "uppercase",
      label: "At least one uppercase letter (A–Z)",
      met: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "At least one lowercase letter (a–z)",
      met: /[a-z]/.test(password),
    },
    {
      id: "digit",
      label: "At least one digit (0–9)",
      met: /[0-9]/.test(password),
    },
    {
      id: "special",
      label: "At least one special character (! @ # $ % ^ & * …)",
      met: PASSWORD_SPECIAL_PATTERN.test(password),
    },
  ];
}

export function isPasswordPolicyMet(password: string): boolean {
  if (!password) {
    return false;
  }

  return evaluatePasswordRequirements(password).every((requirement) => requirement.met);
}

export function passwordRequirementMessage(id: PasswordRequirementId): string {
  return REQUIREMENT_MESSAGES[id];
}

/** First unmet rule message, or undefined when the password meets the policy. */
export function firstUnmetPasswordMessage(password: string): string | undefined {
  const unmet = evaluatePasswordRequirements(password).find((requirement) => !requirement.met);
  return unmet ? passwordRequirementMessage(unmet.id) : undefined;
}
