"use server";

import { redirect } from "next/navigation";
import { env } from "@/config/env";
import { authMessages, mapAuthError, type AuthErrorInfo } from "@/features/auth/messages";
import {
  readPassword,
  readText,
  validateLogin,
  validateSignup,
  type AuthFormState,
} from "@/features/auth/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signupInFlight = new Map<string, Promise<AuthFormState>>();

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

function logAuthDiagnostic(action: "login" | "signup", error: AuthErrorInfo) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.error(`[auth:${action}]`, {
    code: error.code ?? null,
    status: error.status ?? null,
    message: error.message,
  });
}

export async function loginAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readText(formData, "email");
  const password = readPassword(formData, "password");
  const fieldErrors = validateLogin(email, password);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const info = authErrorInfo(error);
      logAuthDiagnostic("login", info);
      return { formError: mapAuthError(info) };
    }
  } catch {
    return { formError: authMessages.unexpected };
  }

  redirect("/app");
}

export async function signupAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fullName = readText(formData, "fullName");
  const email = readText(formData, "email");
  const password = readPassword(formData, "password");
  const confirmPassword = readPassword(formData, "confirmPassword");
  const fieldErrors = validateSignup(fullName, email, password, confirmPassword);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const key = email.toLowerCase();
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
  let outcome: "signed-in" | "confirm" | "registered" = "confirm";

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${env.appUrl}/auth/callback`,
      },
    });

    if (error) {
      const info = authErrorInfo(error);
      logAuthDiagnostic("signup", info);
      return { formError: mapAuthError(info) };
    }

    const identities = data.user?.identities;

    if (data.user && Array.isArray(identities) && identities.length === 0) {
      outcome = "registered";
    } else if (data.session) {
      outcome = "signed-in";
    } else {
      outcome = "confirm";
    }
  } catch {
    return { formError: authMessages.unexpected };
  }

  if (outcome === "registered") {
    return { formError: authMessages.alreadyRegistered };
  }

  if (outcome === "confirm") {
    return { message: authMessages.confirmEmail };
  }

  redirect("/app");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/app?error=signout");
  }

  redirect("/login");
}
