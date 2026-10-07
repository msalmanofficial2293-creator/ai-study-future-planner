"use server";

import { redirect } from "next/navigation";
import { mapAuthError, type AuthErrorInfo } from "@/features/auth/messages";
import { readPassword } from "@/features/auth/validation";
import {
  readChecked,
  validatePasswordChange,
  type PasswordFormState,
  type ProfileFormState,
} from "@/features/profile/validation";
import { saveNotificationPreferences } from "@/services/profile";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

const passwordInFlight = new Map<string, Promise<PasswordFormState>>();
const notificationInFlight = new Map<string, Promise<ProfileFormState>>();

export async function changePasswordAction(
  _previous: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const user = await getAuthenticatedUser();

  if (!user?.email) {
    redirect("/login");
  }

  const pending = passwordInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = persistPassword(user.id, user.email, formData).finally(() => {
    passwordInFlight.delete(user.id);
  });
  passwordInFlight.set(user.id, outcome);
  return outcome;
}

export async function saveNotificationsAction(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = notificationInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = persistNotifications(user.id, formData).finally(() => {
    notificationInFlight.delete(user.id);
  });
  notificationInFlight.set(user.id, outcome);
  return outcome;
}

async function persistPassword(
  userId: string,
  email: string,
  formData: FormData,
): Promise<PasswordFormState> {
  const currentPassword = readPassword(formData, "currentPassword");
  const newPassword = readPassword(formData, "newPassword");
  const confirmPassword = readPassword(formData, "confirmPassword");
  const fieldErrors = validatePasswordChange(currentPassword, newPassword, confirmPassword);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  if (newPassword === currentPassword) {
    return { fieldErrors: { newPassword: "Choose a password that is different from your current password." } };
  }

  const supabase = await createSupabaseServerClient();
  const verified = await supabase.auth.signInWithPassword({ email, password: currentPassword });

  if (verified.error || verified.data.user?.id !== userId) {
    if (verified.error) {
      const info = authErrorInfo(verified.error);
      logAccountDiagnostic("password", info);

      if (isRateLimit(info)) {
        return { formError: mapAuthError(info) };
      }
    }

    return { fieldErrors: { currentPassword: "Current password is incorrect." } };
  }

  const updated = await supabase.auth.updateUser({ password: newPassword });

  if (updated.error) {
    const info = authErrorInfo(updated.error);
    logAccountDiagnostic("password", info);
    return { formError: mapAuthError(info) };
  }

  return { message: "Your password is updated.", savedAt: Date.now() };
}

async function persistNotifications(userId: string, formData: FormData): Promise<ProfileFormState> {
  const result = await saveNotificationPreferences(userId, {
    notifyStudyReminders: readChecked(formData, "notifyStudyReminders"),
    notifyProductUpdates: readChecked(formData, "notifyProductUpdates"),
  });

  if (!result.ok && result.reason === "unauthenticated") {
    redirect("/login");
  }

  if (!result.ok && result.reason === "missing") {
    return { formError: "Your profile is not ready yet. Please try again in a moment." };
  }

  if (!result.ok) {
    return { formError: "Something went wrong. Please try again." };
  }

  return { message: "Notification preferences are saved.", savedAt: Date.now() };
}

function authErrorInfo(error: { message: string; status?: number; code?: string }): AuthErrorInfo {
  return {
    message: error.message,
    status: typeof error.status === "number" ? error.status : undefined,
    code: typeof error.code === "string" ? error.code : undefined,
  };
}

function isRateLimit(error: AuthErrorInfo): boolean {
  return error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit";
}

function logAccountDiagnostic(step: string, error: AuthErrorInfo) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.error(`[profile:${step}]`, {
    code: error.code ?? null,
    status: error.status ?? null,
    message: error.message,
  });
}
