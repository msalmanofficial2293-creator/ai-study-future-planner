import "server-only";

import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  buildAvatarObjectPath,
  isAvatarMimeType,
  isOwnedAvatarPath,
  type AvatarMimeType,
} from "@/features/profile/avatar-constants";
import { publicAvatarUrl } from "@/lib/avatars/url";
import { logServerDiagnostic } from "@/lib/security/log";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

export type AvatarFailureReason =
  | "unauthenticated"
  | "too-large"
  | "invalid-type"
  | "invalid-content"
  | "storage-not-configured"
  | "schema-missing"
  | "storage-denied"
  | "failed";

export type AvatarUploadResult =
  | { ok: true; avatarPath: string; avatarUrl: string }
  | {
      ok: false;
      reason: AvatarFailureReason;
      /** Safe provider/error code for diagnosis. Never includes secrets. */
      diagnosticCode?: string;
    };

export type AvatarRemoveResult =
  | { ok: true }
  | {
      ok: false;
      reason: Extract<
        AvatarFailureReason,
        "unauthenticated" | "storage-not-configured" | "schema-missing" | "storage-denied" | "failed"
      >;
      diagnosticCode?: string;
    };

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP_WEBP = [0x57, 0x45, 0x42, 0x50];

export async function uploadAvatar(file: File): Promise<AvatarUploadResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false, reason: "invalid-type" };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, reason: "too-large" };
  }

  const mime = file.type.trim().toLowerCase();
  if (!isAvatarMimeType(mime)) {
    return { ok: false, reason: "invalid-type" };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesImageSignature(bytes, mime)) {
    return { ok: false, reason: "invalid-content" };
  }

  const objectPath = buildAvatarObjectPath(user.id, mime);
  if (!isOwnedAvatarPath(user.id, objectPath)) {
    return { ok: false, reason: "failed" };
  }

  const supabase = await createSupabaseServerClient();
  const previousPath = await readAvatarPath(supabase, user.id);

  const upload = await supabase.storage.from(AVATAR_BUCKET).upload(objectPath, bytes, {
    contentType: mime,
    upsert: true,
    cacheControl: "3600",
  });

  if (upload.error) {
    logAvatarDiagnostic("storage-upload", upload.error);
    return storageFailure(upload.error);
  }

  const profileWrite = await supabase
    .from("profiles")
    .update({ avatar_path: objectPath })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (profileWrite.error || !profileWrite.data) {
    logAvatarDiagnostic("profile-avatar-path", profileWrite.error);
    await supabase.storage.from(AVATAR_BUCKET).remove([objectPath]);
    return profileFailure(profileWrite.error);
  }

  if (previousPath && previousPath !== objectPath && isOwnedAvatarPath(user.id, previousPath)) {
    const cleanup = await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
    if (cleanup.error) {
      logAvatarDiagnostic("storage-cleanup-old", cleanup.error);
    }
  }

  const avatarUrl = publicAvatarUrl(objectPath, Date.now());
  if (!avatarUrl) {
    return { ok: false, reason: "failed" };
  }

  return { ok: true, avatarPath: objectPath, avatarUrl };
}

export async function removeAvatar(): Promise<AvatarRemoveResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();
  const previousPath = await readAvatarPath(supabase, user.id);

  const profileWrite = await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (profileWrite.error || !profileWrite.data) {
    logAvatarDiagnostic("profile-clear-avatar", profileWrite.error);
    return profileFailure(profileWrite.error);
  }

  if (previousPath && isOwnedAvatarPath(user.id, previousPath)) {
    const cleanup = await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
    if (cleanup.error) {
      logAvatarDiagnostic("storage-remove", cleanup.error);
      return storageFailure(cleanup.error);
    }
  }

  return { ok: true };
}

async function readAvatarPath(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<string | null> {
  const result = await supabase.from("profiles").select("avatar_path").eq("id", userId).maybeSingle();

  if (result.error) {
    logAvatarDiagnostic("read-avatar-path", result.error);
    return null;
  }

  const value = result.data?.avatar_path;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function matchesImageSignature(bytes: Uint8Array, mime: AvatarMimeType): boolean {
  if (mime === "image/jpeg") {
    return startsWith(bytes, JPEG_SIGNATURE);
  }

  if (mime === "image/png") {
    return startsWith(bytes, PNG_SIGNATURE);
  }

  if (mime === "image/webp") {
    return (
      bytes.length >= 12 &&
      startsWith(bytes, WEBP_RIFF) &&
      bytes[8] === WEBP_WEBP[0] &&
      bytes[9] === WEBP_WEBP[1] &&
      bytes[10] === WEBP_WEBP[2] &&
      bytes[11] === WEBP_WEBP[3]
    );
  }

  return false;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }

  return signature.every((value, index) => bytes[index] === value);
}

function logAvatarDiagnostic(step: string, error: { message?: string; code?: string } | null) {
  logServerDiagnostic("avatar", step, error);
}

type ProviderError = {
  message?: string;
  code?: string;
  statusCode?: string | number;
  name?: string;
} | null;

type AvatarProviderFailureReason = Extract<
  AvatarFailureReason,
  "storage-not-configured" | "schema-missing" | "storage-denied" | "failed"
>;

function storageFailure(error: ProviderError): Extract<AvatarRemoveResult, { ok: false }> {
  const classified = classifyProviderError(error, "storage");
  return {
    ok: false,
    reason: classified.reason,
    diagnosticCode: classified.diagnosticCode,
  };
}

function profileFailure(error: ProviderError): Extract<AvatarRemoveResult, { ok: false }> {
  const classified = classifyProviderError(error, "profile");
  return {
    ok: false,
    reason: classified.reason,
    diagnosticCode: classified.diagnosticCode,
  };
}

function classifyProviderError(
  error: ProviderError,
  surface: "storage" | "profile",
): { reason: AvatarProviderFailureReason; diagnosticCode?: string } {
  const code = readErrorToken(error?.code);
  const status = readErrorToken(
    error?.statusCode !== undefined && error?.statusCode !== null
      ? String(error.statusCode)
      : undefined,
  );
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  const diagnosticCode = code ?? status;

  if (
    code === "nosuchbucket" ||
    message.includes("bucket not found") ||
    message.includes("no such bucket")
  ) {
    return { reason: "storage-not-configured", diagnosticCode: diagnosticCode ?? "NoSuchBucket" };
  }

  if (
    code === "42703" ||
    code === "pgrst204" ||
    (message.includes("avatar_path") && message.includes("does not exist")) ||
    (message.includes("could not find the") && message.includes("avatar_path"))
  ) {
    return { reason: "schema-missing", diagnosticCode: diagnosticCode ?? "42703" };
  }

  if (
    code === "42501" ||
    code === "accessdenied" ||
    code === "403" ||
    status === "403" ||
    message.includes("row-level security") ||
    message.includes("not authorized") ||
    message.includes("unauthorized") ||
    message.includes("permission denied")
  ) {
    return {
      reason: surface === "storage" ? "storage-denied" : "failed",
      diagnosticCode: diagnosticCode ?? "AccessDenied",
    };
  }

  return { reason: "failed", diagnosticCode };
}

function readErrorToken(value: string | undefined): string | undefined {
  if (!value || !value.trim()) {
    return undefined;
  }

  return value.trim().slice(0, 64);
}
