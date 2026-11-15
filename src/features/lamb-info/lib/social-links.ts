// Social profile links on lamb_info (facebook_url / instagram_url / x_url).
// Decided in grill-me 2026-11-15: the form accepts either a bare username
// or a pasted link, and we always store one canonical https URL per
// platform. The DB has matching CHECK constraints
// (lamb_info_add_social_links migration) — keep the canonical shapes here
// in sync with those regexes.

export type SocialPlatform = "facebook" | "instagram" | "x";

export const SOCIAL_FIELD = {
  facebook: "facebook_url",
  instagram: "instagram_url",
  x: "x_url",
} as const satisfies Record<SocialPlatform, string>;

const HOSTS: Record<SocialPlatform, string[]> = {
  facebook: ["facebook.com", "fb.com"],
  instagram: ["instagram.com"],
  x: ["x.com", "twitter.com"],
};

const USERNAME: Record<SocialPlatform, RegExp> = {
  facebook: /^[A-Za-z0-9.]{1,50}$/,
  instagram: /^[A-Za-z0-9._]{1,30}$/,
  x: /^[A-Za-z0-9_]{1,15}$/,
};

const BASE: Record<SocialPlatform, string> = {
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
  x: "https://x.com/",
};

const NOT_A_PROFILE = new Set([
  "p",
  "reel",
  "reels",
  "stories",
  "explore",
  "tv",
  "i",
  "home",
  "search",
  "hashtag",
  "intent",
  "share",
]);

export type NormalizeResult =
  | { ok: true; value: string | null }
  | { ok: false };

/**
 * Turn whatever the user typed (username, @username, or a full/partial
 * link) into the canonical URL we store. Empty input → null (clears the
 * field). Links to any other domain are rejected.
 */
export function normalizeSocialLink(
  platform: SocialPlatform,
  input: string | null | undefined,
): NormalizeResult {
  const raw = (input ?? "").trim();
  if (!raw) return { ok: true, value: null };

  const looksLikeUrl = /^https?:\/\//i.test(raw) || raw.includes("/");
  if (!looksLikeUrl) {
    const username = raw.replace(/^@/, "");
    if (!USERNAME[platform].test(username)) return { ok: false };
    return { ok: true, value: BASE[platform] + username };
  }

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ok: false };
  }
  const host = url.hostname.toLowerCase().replace(/^(www|m|mobile|web)\./, "");
  if (!HOSTS[platform].includes(host)) return { ok: false };

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return { ok: false };

  if (platform === "facebook") {
    // Profiles without a vanity username look like profile.php?id=123 —
    // the id lives in the query string, so keep it (and only it).
    if (segments[0] === "profile.php") {
      const id = url.searchParams.get("id");
      if (!id || !/^\d+$/.test(id)) return { ok: false };
      return { ok: true, value: `${BASE.facebook}profile.php?id=${id}` };
    }
    return { ok: true, value: BASE.facebook + segments.join("/") };
  }

  const username = segments[0].replace(/^@/, "");
  // A post/reel/search link isn't a profile — don't store "/p" as a user.
  if (NOT_A_PROFILE.has(username.toLowerCase())) return { ok: false };
  if (!USERNAME[platform].test(username)) return { ok: false };
  return { ok: true, value: BASE[platform] + username };
}
