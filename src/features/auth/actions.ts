"use server";

import { redirect } from "next/navigation";
import { env } from "@/config/env";
import { allowAuthAttempt, allowVerificationResend } from "@/features/auth/allowance";
import {
  EMAIL_VERIFICATION_REQUIRED_KEY,
  isUserEmailVerified,
  normalizeAuthEmail,
} from "@/features/auth/email-status";
import {
  authErrorOffersResend,
  authMessages,
  classifyAuthError,
  mapAuthError,
  sanitizeAuthDiagnosticMessage,
  type AuthErrorInfo,
} from "@/features/auth/messages";
import {
  readPassword,
  readText,
  validateEmail,
  validateLogin,
  validateSignup,
  type AuthFormState,
} from "@/features/auth/validation";
import { authDestination, hasCompletedOnboarding } from "@/services/onboarding-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signupInFlight = new Map<string, Promise<AuthFormState>>();
const resendInFlight = new Map<string, Promise<AuthFormState>>();

function authErrorInfo(error: {
  message: string;
  status?: number;
  code?: string;
}): AuthErrorInfo {
  return {
    message: error.message,
    status: typeof error.status === "number" ? error.status : undefined,
    code: typeof error.code === "string" ? error.code : undefined,
  };
}

function logAuthDiagnostic(
  action: "login" | "signup" | "resend-verification" | "logout" | "signup-config",
  error: AuthErrorInfo,
) {
  const kind = classifyAuthError(error);
  const safeMessage = sanitizeAuthDiagnosticMessage(error.message);

  // Safe fields only: never log passwords, tokens, or raw redirect URLs with secrets.
  console.error(`[auth:${action}]`, {
    code: error.code ?? null,
    kind,
    status: error.status ?? null,
    message: safeMessage,
  });
}

function logConfirmEmailLikelyDisabled() {
  console.error(
    "[auth:signup-config] signUp returned an immediately confirmed session. Enable Authentication → Providers → Email → Confirm email in the Supabase Dashboard, and add /auth/callback to Redirect URLs.",
  );
}

function emailRedirectTo(): string {
  return `${env.appUrl}/auth/callback`;
}

export async function loginAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = normalizeAuthEmail(readText(formData, "email"));
  const password = readPassword(formData, "password");
  const fieldErrors = validateLogin(email, password);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  if (!allowAuthAttempt(email)) {
    return { formError: "Too many attempts. Please wait a minute and try again." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const info = authErrorInfo(error);
      logAuthDiagnostic("login", info);
      const errorKind = classifyAuthError(info);
      const mapped = mapAuthError(info);

      if (errorKind === "email-not-confirmed") {
        return {
          formError: mapped,
          errorKind,
          pendingEmail: email,
          needsVerification: true,
        };
      }

      return { formError: mapped, errorKind };
    }

    if (!data.user) {
      return { formError: authMessages.unexpected };
    }

    if (!isUserEmailVerified(data.user)) {
      await supabase.auth.signOut();
      return {
        formError: authMessages.emailNotConfirmed,
        errorKind: "email-not-confirmed",
        pendingEmail: email,
        needsVerification: true,
      };
    }

    redirect(authDestination(await hasCompletedOnboarding(supabase, data.user.id)));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return { formError: authMessages.unexpected };
  }
}

export async function signupAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fullName = readText(formData, "fullName");
  const email = normalizeAuthEmail(readText(formData, "email"));
  const password = readPassword(formData, "password");
  const confirmPassword = readPassword(formData, "confirmPassword");
  const fieldErrors = validateSignup(fullName, email, password, confirmPassword);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  if (!allowAuthAttempt(email)) {
    return { formError: "Too many attempts. Please wait a minute and try again." };
  }

  const key = email;
  const current = signupInFlight.get(key);

  if (current) {
    return current;
  }

  const pending = runSignup(fullName, email, password);
  signupInFlight.set(key, pending);

  try {
    return await pending;
  } finally {
    if (signupInFlight.get(key) === pending) {
      signupInFlight.delete(key);
    }
  }
}

async function runSignup(
  fullName: string,
  email: string,
  password: string,
): Promise<AuthFormState> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          // Cleared only in /auth/callback after a successful verification exchange.
          [EMAIL_VERIFICATION_REQUIRED_KEY]: true,
        },
        emailRedirectTo: emailRedirectTo(),
      },
    });

    if (error) {
      const info = authErrorInfo(error);
      logAuthDiagnostic("signup", info);
      const errorKind = classifyAuthError(info);
      return {
        formError: mapAuthError(info),
        errorKind,
        pendingEmail: email,
        needsVerification: authErrorOffersResend(errorKind),
      };
    }

    const identities = data.user?.identities;

    // Supabase returns a user with empty identities for an existing email (no overwrite).
    if (data.user && Array.isArray(identities) && identities.length === 0) {
      if (data.session) {
        await supabase.auth.signOut();
      }

      return {
        formError: authMessages.alreadyRegistered,
        errorKind: "already-registered",
        pendingEmail: email,
      };
    }

    // Never open the authenticated app from signup. Clear any provisional session.
    if (data.session) {
      if (data.user?.email_confirmed_at) {
        logConfirmEmailLikelyDisabled();
        logAuthDiagnostic("signup-config", {
          message: "immediate_confirmed_session",
          code: "confirm_email_likely_disabled",
        });
      }

      await supabase.auth.signOut();
    }

    return {
      message: authMessages.confirmEmail,
      pendingEmail: email,
      needsVerification: true,
    };
  } catch {
    return { formError: authMessages.unexpected };
  }
}

export async function resendVerificationAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = normalizeAuthEmail(readText(formData, "email"));
  const emailError = validateEmail(email);

  if (emailError) {
    return { fieldErrors: { email: emailError } };
  }

  if (!allowVerificationResend(email)) {
    return {
      formError:
        "Too many verification emails were requested. Please wait a few minutes and try again.",
    };
  }

  const key = email;
  const current = resendInFlight.get(key);

  if (current) {
    return current;
  }

  const pending = runResendVerification(email);
  resendInFlight.set(key, pending);

  try {
    return await pending;
  } finally {
    if (resendInFlight.get(key) === pending) {
      resendInFlight.delete(key);
    }
  }
}

async function runResendVerification(email: string): Promise<AuthFormState> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: emailRedirectTo(),
      },
    });

    if (error) {
      const info = authErrorInfo(error);
      logAuthDiagnostic("resend-verification", info);
      const errorKind = classifyAuthError(info);

      // Surface delivery/rate-limit failures honestly — do not claim an email was sent.
      if (authErrorOffersResend(errorKind) || errorKind === "request-rate-limit") {
        return {
          formError: mapAuthError(info),
          errorKind,
          pendingEmail: email,
          needsVerification: true,
        };
      }

      // Generic Auth failures: avoid confirming whether the address exists.
      return {
        message: authMessages.confirmEmailResent,
        pendingEmail: email,
        needsVerification: true,
      };
    }

    return {
      message: authMessages.confirmEmailResent,
      pendingEmail: email,
      needsVerification: true,
    };
  } catch {
    return { formError: authMessages.unexpected };
  }
}

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    logAuthDiagnostic("logout", authErrorInfo(error));
    redirect("/app?error=signout");
  }

  redirect("/login");
}
