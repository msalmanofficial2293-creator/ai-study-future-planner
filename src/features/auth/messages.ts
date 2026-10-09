const UNEXPECTED = "Something went wrong. Please try again.";

export type AuthErrorInfo = {
  message: string;
  status?: number;
  code?: string;
};

export function mapAuthError(error: AuthErrorInfo): string {
  if (error.code === "over_email_send_rate_limit") {
    return "The confirmation email could not be sent yet. Please wait a little while and try again.";
  }

  if (error.code === "over_request_rate_limit") {
    return "Too many attempts. Please wait and try again.";
  }

  if (error.code === "email_not_confirmed") {
    return authMessages.emailNotConfirmed;
  }

  const normalized = error.message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "Invalid email or password.";
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already exists") ||
    error.code === "user_already_exists"
  ) {
    return authMessages.alreadyRegistered;
  }

  if (
    normalized.includes("password") &&
    (normalized.includes("weak") ||
      normalized.includes("at least") ||
      normalized.includes("should be") ||
      normalized.includes("pwned") ||
      normalized.includes("known to be"))
  ) {
    return "Please choose a stronger password.";
  }

  if (
    normalized.includes("unable to validate email") ||
    normalized.includes("invalid email") ||
    (normalized.includes("email") && normalized.includes("invalid"))
  ) {
    return "Enter a valid email address.";
  }

  if (
    normalized.includes("signups not allowed") ||
    normalized.includes("signup is disabled")
  ) {
    return "Account creation is not available right now. Please try again later.";
  }

  if (normalized.includes("email rate limit")) {
    return "The confirmation email could not be sent yet. Please wait a little while and try again.";
  }

  if (
    normalized.includes("request rate limit") ||
    normalized.includes("too many requests")
  ) {
    return "Too many attempts. Please wait and try again.";
  }

  if (normalized.includes("email not confirmed")) {
    return authMessages.emailNotConfirmed;
  }

  return UNEXPECTED;
}

export const authMessages = {
  unexpected: UNEXPECTED,
  passwordMismatch: "Passwords do not match.",
  weakPassword: "Please choose a stronger password.",
  confirmEmail:
    "Check your email to verify your account before signing in. Open the verification link we sent, then log in.",
  confirmEmailResent:
    "If an account exists for that email and still needs verification, a new verification link has been sent. Check your inbox and spam folder.",
  emailNotConfirmed:
    "Confirm your email before logging in. Check your inbox for the verification link, or request a new one below.",
  callbackError:
    "That verification link is invalid or has expired. Request a new verification email, then try again.",
  callbackExpired:
    "That verification link has expired. Request a new verification email, then try again.",
  alreadyRegistered:
    "If an account already exists for this email, please log in instead. No new account was created.",
} as const;

export function loginInitialError(code: string | undefined): string | undefined {
  switch (code) {
    case "callback":
      return authMessages.callbackError;
    case "expired":
      return authMessages.callbackExpired;
    case "unverified":
      return authMessages.emailNotConfirmed;
    case "signout":
      return authMessages.unexpected;
    default:
      return undefined;
  }
}
