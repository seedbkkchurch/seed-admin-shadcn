// Shared Web Push helper (grill-me follow-up, 2026-08-12) — used by both
// the lamb /subscribe flow and the admin "ทดสอบ" test-device flow.

// PushManager wants the VAPID key as a raw Uint8Array, but env vars are
// necessarily strings — this is the standard base64url -> Uint8Array
// conversion from the Web Push spec examples.
export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined;

// Gets (or creates) this browser's PushManager subscription. Shared by both
// the lamb-facing and admin-test subscribe flows — only what happens with
// the resulting subscription (which Supabase table it's saved to) differs
// between them.
export async function getOrCreatePushSubscription(): Promise<PushSubscription> {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("Missing VITE_VAPID_PUBLIC_KEY");
  }
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
}
