import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getOrCreatePushSubscription } from "@/lib/web-push";

export type TestPushResult =
  | { ok: true; sent: number; failed: number }
  | { ok: false; reason: "permission-denied" | "unsupported" | "error" };

/**
 * Backs the "ทดสอบ" button in Settings > Notifications (grill-me follow-up,
 * 2026-08-12). Subscribes *this staff device* to push (stored separately in
 * `admin_test_push_subscription`, since staff usually aren't lambs in
 * lamb_info) and then asks the Edge Function to send a real push through
 * the full pipeline — proves the whole chain works independent of whether
 * any lamb currently has a missing เฝ้าเดี่ยว to be reminded about.
 */
export function useAdminTestPush() {
  const [status, setStatus] = useState<"idle" | "sending">("idle");

  const sendTest = useCallback(async (): Promise<TestPushResult> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return { ok: false, reason: "unsupported" };
    }

    setStatus("sending");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return { ok: false, reason: "permission-denied" };
      }

      const subscription = await getOrCreatePushSubscription();
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Push subscription missing endpoint/keys");
      }

      const { error: upsertError } = await supabase
        .from("admin_test_push_subscription")
        .upsert(
          {
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
            user_agent: navigator.userAgent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "endpoint" },
        );
      if (upsertError) throw upsertError;

      const { data, error: invokeError } = await supabase.functions.invoke(
        "send-devotion-reminders",
        { body: { mode: "test" } },
      );
      if (invokeError) throw invokeError;

      return {
        ok: true,
        sent: data?.sent ?? 0,
        failed: data?.failed ?? 0,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return { ok: false, reason: "error" };
    } finally {
      setStatus("idle");
    }
  }, []);

  return { sendTest, status };
}
