const UNEXPECTED = "Something went wrong. Please try again.";

export type AuthErrorInfo = {
  message: string;
  status?: number;
  code?: string;
};

export type AuthErrorKind =
  | "email-rate-limit"
  | "request-rate-limit"
  | "email-not-authorized"
  | "email-delivery"
  | "already-registered"
  | "invalid-credentials"
  | "weak-password"
  | "invalid-email"
  | "email-not-confirmed"
  | "signup-disabled"
  | "unexpected";

export function classifyAuthError(error: AuthErrorInfo): AuthErrorKind {
  const code = (error.code ?? "").toLowerCase();
  const normalized = error.message.toLowerCase();

  if (code === "over_email_send_rate_limit" || normalized.includes("email rate limit")) {
    return "email-rate-limit";
  }

  if (
    code === "over_request_rate_limit" ||
    normalized.includes("request rate limit") ||
    normalized.includes("too many requests")
  ) {
    return "request-rate-limit";
  }

  if (
    code === "email_address_not_authorized" ||
    normalized.includes("email address not authorized") ||
    (normalized.includes("not authorized") && normalized.includes("email"))
  ) {
    return "email-not-authorized";
  }

  if (
    code === "email_not_confirmed" ||
    normalized.includes("email not confirmed")
  ) {
    return "email-not-confirmed";
  }

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already exists") ||
    normalized.includes("email address already exists")
  ) {
    return "already-registered";
  }

  if (
    code === "invalid_credentials" ||
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "invalid-credentials";
  }

  if (
    code === "weak_password" ||
    (normalized.includes("password") &&
      (normalized.includes("weak") ||
        normalized.includes("at least") ||
        normalized.includes("should be") ||
        normalized.includes("pwned") ||
        normalized.includes("known to be")))
  ) {
    return "weak-password";
  }

  if (
    code === "email_address_invalid" ||
    (code === "validation_failed" && normalized.includes("email")) ||
    normalized.includes("unable to validate email") ||
    normalized.includes("invalid email") ||
    (normalized.includes("email") && normalized.includes("invalid"))
  ) {
    return "invalid-email";
  }

  if (
    code === "email_provider_disabled" ||
    code === "signup_disabled" ||
    normalized.includes("signups not allowed") ||
    normalized.includes("signup is disabled")
  ) {
    return "signup-disabled";
  }

  if (
    (code === "unexpected_failure" && normalized.includes("email")) ||
    (normalized.includes("error sending") && normalized.includes("email")) ||
    (normalized.includes("unable to send") && normalized.includes("email")) ||
    normalized.includes("smtp")
  ) {
    return "email-delivery";
  }

  return "unexpected";
}

export function mapAuthError(error: AuthErrorInfo): string {
  switch (classifyAuthError(error)) {
    case "email-rate-limit":
      return authMessages.emailRateLimited;
    case "request-rate-limit":
      return authMessages.requestRateLimited;
    case "email-not-authorized":
      return authMessages.emailNotAuthorized;
    case "email-delivery":
      return authMessages.emailDeliveryFailed;
    case "already-registered":
      return authMessages.alreadyRegistered;
    case "invalid-credentials":
      return "Invalid email or password.";
    case "weak-password":
      return "Please choose a stronger password.";
    case "invalid-email":
      return "Enter a valid email address.";
    case "email-not-confirmed":
      return authMessages.emailNotConfirmed;
    case "signup-disabled":
      return "Account creation is not available right now. Please try again later.";
    default:
      return UNEXPECTED;
  }
}

/** True when the UI should offer resend without claiming an email was just sent. */
export function authErrorOffersResend(kind: AuthErrorKind | undefined): boolean {
  return (
    kind === "email-rate-limit" ||
    kind === "email-delivery" ||
    kind === "email-not-authorized" ||
    kind === "email-not-confirmed"
  );
}

export const authMessages = {
  unexpected: UNEXPECTED,
  passwordMismatch: "Passwords do not match.",
  weakPassword: "Please choose a stronger password.",
  confirmEmail:
    "Please check your email and verify your account before signing in.",
  confirmEmailResent:
    "If an account exists for that email and still needs verification, a new verification link has been sent. Check your inbox and spam folder.",
  emailNotConfirmed:
    "Please check your email and verify your account before signing in. You can request a new verification link below.",
  emailRateLimited:
    "The confirmation email could not be sent yet because too many emails were requested. Wait a while, then use Resend verification below. No confirmation email was sent just now.",
  emailNotAuthorized:
    "This email address cannot receive confirmation messages with the project's current email provider. Try again later, or ask the site owner to configure a custom SMTP provider. No confirmation email was sent.",
  emailDeliveryFailed:
    "We could not send the confirmation email. Wait a moment and use Resend verification below, or try again later. No confirmation email was sent just now.",
  requestRateLimited: "Too many attempts. Please wait and try again.",
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

/** Strip tokens/URLs from Auth provider messages before logging. */
export function sanitizeAuthDiagnosticMessage(message: string): string {
  return message
    .replace(/https?:\/\/[^\s]+/gi, "[url]")
    .replace(/([?&](?:token|token_hash|access_token|refresh_token|code)=)[^&\s]+/gi, "$1[redacted]")
    .slice(0, 240);
}
