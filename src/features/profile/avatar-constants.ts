export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const AVATAR_ALLOWED_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AvatarMimeType = keyof typeof AVATAR_ALLOWED_MIME;

export const AVATAR_ACCEPT = Object.keys(AVATAR_ALLOWED_MIME).join(",");

export function isAvatarMimeType(value: string): value is AvatarMimeType {
  return value in AVATAR_ALLOWED_MIME;
}

export function avatarExtensionForMime(mime: AvatarMimeType): string {
  return AVATAR_ALLOWED_MIME[mime];
}

export function buildAvatarObjectPath(userId: string, mime: AvatarMimeType): string {
  return `${userId}/avatar.${avatarExtensionForMime(mime)}`;
}

/** Path must be exactly `{uuid}/avatar.{jpg|jpeg|png|webp}` owned by that uuid. */
export function isOwnedAvatarPath(userId: string, path: string): boolean {
  if (!userId || !path || path.includes("..") || path.includes("\\")) {
    return false;
  }

  const expectedPrefix = `${userId}/avatar.`;
  if (!path.startsWith(expectedPrefix)) {
    return false;
  }

  const extension = path.slice(expectedPrefix.length).toLowerCase();
  return extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "webp";
}
