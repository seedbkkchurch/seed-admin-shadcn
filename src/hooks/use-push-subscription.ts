import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getOrCreatePushSubscription } from "@/lib/web-push";

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
 *
 * IMPORTANT: call `subscribe()` directly from a click/tap handler, with no
 * `await` before it — Notification.requestPermission() only reliably shows
 * the browser's permission dialog in response to a fresh user gesture, and
 * that "activation" can expire if other async work runs first.
 */
export function usePushSubscription() {
  const [status, setStatus] = useState<"idle" | "subscribing">("idle");

  const subscribe = useCallback(
    async (lambId: string): Promise<SubscribeResult> => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return "unsupported";
      }

      setStatus("subscribing");
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return "permission-denied";

        const subscription = await getOrCreatePushSubscription();
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
