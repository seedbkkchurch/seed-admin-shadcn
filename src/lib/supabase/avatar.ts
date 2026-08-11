import { supabase } from "./client";

const AVATAR_BUCKET = "bucket-seed";
// Bucket was reorganized into top-level public/ and private/ folders (per
// grill-me follow-up 2026-08-11) — avatars live under public/ since they're
// always meant to be publicly visible.
const AVATAR_PREFIX = "public/seedbkk/profile";

// Supabase Storage keys must be ASCII-safe — non-ASCII characters (e.g. Thai)
// are rejected with "Invalid key". Most nicknames in this app are Thai, so
// this strips down to ASCII letters/digits only; when nothing ASCII is left
// (the common case), the filename falls back to just the lambId.
function slugify(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function avatarPath(nickname: string, lambId: string): string {
  const safeNickname = slugify(nickname);
  const base = safeNickname ? `${safeNickname}-${lambId}` : lambId;
  return `${AVATAR_PREFIX}/${base}.jpg`;
}

function publicUrlToPath(url: string): string | null {
  const marker = `/object/public/${AVATAR_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

/**
 * Uploads a (pre-resized) avatar blob to Supabase Storage at
 * `public/seedbkk/profile/{nickname}-{lambId}.jpg`, deleting the old file
 * first if one is passed in. Returns the new public URL.
 */
export async function uploadAvatar({
  blob,
  nickname,
  lambId,
  previousUrl,
}: {
  blob: Blob;
  nickname: string;
  lambId: string;
  previousUrl?: string | null;
}): Promise<string> {
  const path = avatarPath(nickname, lambId);

  if (previousUrl) {
    await deleteAvatarByUrl(previousUrl);
  }

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, blob, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  // Bust any cached copy of a previously-uploaded file at the same path.
  return `${publicUrl}?v=${Date.now()}`;
}

/** Deletes a stored avatar given its public URL. Silently no-ops on non-bucket URLs. */
export async function deleteAvatarByUrl(url: string): Promise<void> {
  const path = publicUrlToPath(url);
  if (!path) return;
  const cleanPath = path.split("?")[0];
  await supabase.storage.from(AVATAR_BUCKET).remove([cleanPath]);
}
