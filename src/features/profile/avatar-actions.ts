"use server";

import { redirect } from "next/navigation";
import { AVATAR_MAX_BYTES } from "@/features/profile/avatar-constants";
import { removeAvatar, uploadAvatar } from "@/services/avatar";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export type AvatarActionState = {
  message?: string;
  error?: string;
  avatarUrl?: string | null;
  savedAt?: number;
};

const uploadInFlight = new Map<string, Promise<AvatarActionState>>();
const removeInFlight = new Map<string, Promise<AvatarActionState>>();

export async function uploadAvatarAction(
  _previous: AvatarActionState,
  formData: FormData,
): Promise<AvatarActionState> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = uploadInFlight.get(user.id);
  if (pending) {
    return pending;
  }

  const outcome = runUpload(formData).finally(() => {
    uploadInFlight.delete(user.id);
  });
  uploadInFlight.set(user.id, outcome);
  return outcome;
}

export async function removeAvatarAction(
  previous: AvatarActionState,
  formData: FormData,
): Promise<AvatarActionState> {
  void previous;
  void formData;
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = removeInFlight.get(user.id);
  if (pending) {
    return pending;
  }

  const outcome = runRemove().finally(() => {
    removeInFlight.delete(user.id);
  });
  removeInFlight.set(user.id, outcome);
  return outcome;
}

async function runUpload(formData: FormData): Promise<AvatarActionState> {
  const entry = formData.get("avatar");

  if (!(entry instanceof File) || entry.size <= 0) {
    return { error: "Choose a JPG, PNG, or WebP image." };
  }

  if (entry.size > AVATAR_MAX_BYTES) {
    return { error: "Profile photo must be 5 MB or smaller." };
  }

  const result = await uploadAvatar(entry);

  if (!result.ok) {
    if (result.reason === "unauthenticated") {
      redirect("/login");
    }

    return { error: friendlyUploadError(result.reason, result.diagnosticCode) };
  }

  return {
    message: "Profile photo updated.",
    avatarUrl: result.avatarUrl,
    savedAt: Date.now(),
  };
}

async function runRemove(): Promise<AvatarActionState> {
  const result = await removeAvatar();

  if (!result.ok) {
    if (result.reason === "unauthenticated") {
      redirect("/login");
    }

    return { error: friendlyRemoveError(result.reason, result.diagnosticCode) };
  }

  return {
    message: "Profile photo removed.",
    avatarUrl: null,
    savedAt: Date.now(),
  };
}

function friendlyUploadError(
  reason:
    | "too-large"
    | "invalid-type"
    | "invalid-content"
    | "storage-not-configured"
    | "schema-missing"
    | "storage-denied"
    | "failed",
  diagnosticCode?: string,
): string {
  switch (reason) {
    case "too-large":
      return "Profile photo must be 5 MB or smaller.";
    case "invalid-type":
    case "invalid-content":
      return "Use a JPG, PNG, or WebP image.";
    case "storage-not-configured":
      return withDiagnostic(
        "Photo storage is not set up yet. Apply the avatars Storage migration, then try again.",
        diagnosticCode,
      );
    case "schema-missing":
      return withDiagnostic(
        "Profile photo storage is missing a required database column. Apply the avatars migration, then try again.",
        diagnosticCode,
      );
    case "storage-denied":
      return withDiagnostic(
        "You do not have permission to update this photo. Sign in again and try once more.",
        diagnosticCode,
      );
    default:
      return withDiagnostic("Could not update your photo. Please try again.", diagnosticCode);
  }
}

function friendlyRemoveError(
  reason: "storage-not-configured" | "schema-missing" | "storage-denied" | "failed",
  diagnosticCode?: string,
): string {
  switch (reason) {
    case "storage-not-configured":
      return withDiagnostic(
        "Photo storage is not set up yet. Apply the avatars Storage migration, then try again.",
        diagnosticCode,
      );
    case "schema-missing":
      return withDiagnostic(
        "Profile photo storage is missing a required database column. Apply the avatars migration, then try again.",
        diagnosticCode,
      );
    case "storage-denied":
      return withDiagnostic(
        "You do not have permission to remove this photo. Sign in again and try once more.",
        diagnosticCode,
      );
    default:
      return withDiagnostic("Could not remove your photo. Please try again.", diagnosticCode);
  }
}

function withDiagnostic(message: string, diagnosticCode?: string): string {
  if (!diagnosticCode || process.env.NODE_ENV === "production") {
    return message;
  }

  return `${message} (${diagnosticCode})`;
}
