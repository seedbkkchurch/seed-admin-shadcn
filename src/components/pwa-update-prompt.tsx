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
 * Watches for new service-worker versions (i.e. new deploys) and prompts
 * the user with a toast to refresh once one is available. Mount once near
 * the root of the app, alongside <Toaster />.
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

    toastIdRef.current = toast("มีอัปเดตใหม่ของแอปพร้อมใช้งาน", {
      description: "กด “รีเฟรช” เพื่อใช้เวอร์ชันล่าสุด",
      duration: Infinity,
      action: {
        label: "รีเฟรช",
        onClick: () => updateServiceWorker(true),
      },
    });

    return () => {
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [needRefresh, updateServiceWorker]);

  return null;
}
