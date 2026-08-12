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
