import { AVATAR_BUCKET } from "@/features/profile/avatar-constants";
import { readSupabasePublicConfig } from "@/lib/supabase/config";

/** Public object URL for a stored avatar path. Returns null when path is empty. */
export function publicAvatarUrl(
  avatarPath: string | null | undefined,
  cacheToken?: string | number | null,
): string | null {
  const path = avatarPath?.trim();
  if (!path) {
    return null;
  }

  const { url } = readSupabasePublicConfig();
  const base = `${url}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
  if (cacheToken === undefined || cacheToken === null || cacheToken === "") {
    return base;
  }

  return `${base}?v=${encodeURIComponent(String(cacheToken))}`;
}
