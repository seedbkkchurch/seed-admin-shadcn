import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined;

// PushManager wants the VAPID key as a raw Uint8Array, but env vars are
// necessarily strings — this is the standard base64url -> Uint8Array
// conversion from the Web Push spec examples.
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export type SubscribeResult =
  | "subscribed"
  | "permission-denied"
  | "unsupported"
  | "error";

/**
 * Subscribes the current device to Web Push and links it to a lamb_id in
 * `lamb_push_subscription` (grill-me follow-up, 2026-08-12 — เฝ้าเดี่ยว
 * reminder feature). No login exists for lambs yet, so "linking" just means
 * whichever lamb was selected on the /subscribe page; re-subscribing the
 * same browser under a different name reassigns that device (upsert keyed
 * on the push endpoint, which is stable per browser+origin).
 */
export function usePushSubscription() {
  const [status, setStatus] = useState<"idle" | "subscribing">("idle");

  const subscribe = useCallback(
    async (lambId: string): Promise<SubscribeResult> => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return "unsupported";
      }
      if (!VAPID_PUBLIC_KEY) {
        // eslint-disable-next-line no-console
        console.error(
          "Missing VITE_VAPID_PUBLIC_KEY — cannot subscribe to push.",
        );
        return "error";
      }

      setStatus("subscribing");
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return "permission-denied";

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          throw new Error("Push subscription missing endpoint/keys");
        }

        const { error } = await supabase.from("lamb_push_subscription").upsert(
          {
            lamb_id: lambId,
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
            user_agent: navigator.userAgent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "endpoint" },
        );
        if (error) throw error;

        return "subscribed";
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        return "error";
      } finally {
        setStatus("idle");
      }
    },
    [],
  );

  return { subscribe, status };
}
