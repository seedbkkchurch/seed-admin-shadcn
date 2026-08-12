import { useCallback, useEffect, useState } from "react";

// `beforeinstallprompt` isn't in the standard DOM lib typings yet.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari exposes this instead of the display-mode media query.
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Drives the in-app "Install app" button (grill-me follow-up, 2026-08-12).
 *
 * - Android/desktop Chrome & Edge: captures the `beforeinstallprompt` event
 *   and exposes `promptInstall()` to trigger the native install prompt.
 * - iOS Safari: never fires `beforeinstallprompt` (no such API), so
 *   `canInstall` is still `true` there (when not already installed) but
 *   callers should show manual "Add to Home Screen" instructions instead of
 *   calling `promptInstall()`. Use `isIos` to branch.
 * - Once installed (or already running standalone), `canInstall` is `false`
 *   and stays that way — the button should be hidden entirely.
 */
export function usePwaInstall() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    if (installed) return;

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [installed]);

  const promptInstall = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    // Chrome only allows a captured prompt to be used once.
    setInstallEvent(null);
    return outcome;
  }, [installEvent]);

  const ios = isIos();

  return {
    // On iOS there's no beforeinstallprompt to wait for, so surface the
    // button as soon as we know the app isn't already installed.
    canInstall: !installed && (ios || installEvent !== null),
    isIos: ios,
    promptInstall,
  };
}
