// Shared PWA environment checks (grill-me follow-up, 2026-08-12) — used by
// both the install button and the push-subscribe page, since both need to
// know "is this iOS" and "is this already running as an installed app".

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari exposes this instead of the display-mode media query.
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Google sign-in + installed PWA (grill-me follow-up, 2026-08-23) — on iOS,
// starting OAuth from the standalone home-screen webview always hands off
// to a real Safari tab (no way around it, not a bug — see user-auth-form.tsx
// handleGoogleSignIn). sessionStorage doesn't survive that hand-off because
// it's a new top-level browsing context, so we mark the attempt in
// localStorage (shared per-origin regardless of context) right before the
// full-page redirect, and consume it once the callback route loads back up.
// Short TTL so a stale flag from an abandoned attempt never mis-fires on a
// later, unrelated visit to the same origin in plain Safari.
const IOS_OAUTH_FLAG_KEY = "auth:ios-standalone-oauth-started-at";
const IOS_OAUTH_FLAG_TTL_MS = 5 * 60 * 1000;

export function markIosStandaloneOAuthStart() {
  try {
    window.localStorage.setItem(IOS_OAUTH_FLAG_KEY, String(Date.now()));
  } catch {
    // localStorage อาจใช้ไม่ได้ (private mode ฯลฯ) — แค่แปลว่า fallback
    // message จะไม่โชว์ตอนกลับมา ไม่ใช่เรื่องคอขวดของการ login
  }
}

/** Reads + clears the flag in one go — meant to be called exactly once,
 * on mount of the popup-callback route. */
export function consumeIosStandaloneOAuthFlag(): boolean {
  try {
    const raw = window.localStorage.getItem(IOS_OAUTH_FLAG_KEY);
    window.localStorage.removeItem(IOS_OAUTH_FLAG_KEY);
    if (!raw) return false;
    const startedAt = Number(raw);
    return Number.isFinite(startedAt) && Date.now() - startedAt <= IOS_OAUTH_FLAG_TTL_MS;
  } catch {
    return false;
  }
}
