import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

// How often to actively poll for a new service worker while a tab is left
// open for a long time. The browser only checks for updates on its own
// when the page navigates/reloads, so a tab left open for hours (common
// for an admin dashboard) would otherwise not notice a new deploy until
// someone manually reloads it.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1h

/**
 * Watches for new service-worker versions (i.e. new deploys) and applies
 * them automatically, reloading the page as soon as one is available.
 *
 * grill-me 2026-08-29: switched from a "รีเฟรช" toast the user had to
 * click to this auto-reload — a plain browser/OS reload is NOT the same
 * as clicking that toast's action (only the toast called
 * updateServiceWorker(true), which does the SKIP_WAITING handshake +
 * waits for `controllerchange` before reloading), so users on the PWA
 * kept hitting their device's own reload and staying on the old cached
 * version, confused about why "updating" didn't do anything. Auto-calling
 * updateServiceWorker(true) here removes that manual step entirely — the
 * brief toast below is purely informational (no action needed), it just
 * explains the reload that's about to happen so it doesn't feel like a
 * random page flash.
 */
export function PwaUpdatePrompt() {
  const toastIdRef = useRef<string | number | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      window.setInterval(() => {
        registration.update().catch(() => {
          // Ignore transient network errors; the next interval will retry.
        });
      }, UPDATE_CHECK_INTERVAL_MS);
    },
    onRegisterError(error) {
      // eslint-disable-next-line no-console
      console.error("Service worker registration failed", error);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;

    toastIdRef.current = toast("พบอัปเดตใหม่ — กำลังโหลดเวอร์ชันล่าสุด...", {
      duration: 4000,
    });

    void updateServiceWorker(true);
  }, [needRefresh, updateServiceWorker]);

  return null;
}
