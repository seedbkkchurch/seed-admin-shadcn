import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { consumeIosStandaloneOAuthFlag } from "@/lib/pwa";

// Google OAuth ↔ installed-PWA popup flow (grill-me 2026-08-23). Two ways to
// land here, both via redirectTo passed to supabase.auth.signInWithOAuth in
// user-auth-form.tsx:
//
// 1. Opened as a popup (window.open) from the sign-in page — the common
//    case on Android/desktop, where a popup can genuinely open without
//    dragging the installed PWA's own window out of standalone mode. Here we
//    just grab the session, tell the opener via postMessage, and close
//    ourselves — the opener (still showing the app, never navigated) is what
//    does the real routing.
// 2. A normal top-level full-page redirect — either the iOS-standalone path
//    (handleGoogleSignIn skips the popup entirely there, see pwa.ts comment)
//    or the popup-blocked fallback for any platform. No window.opener here.
//    iOS-standalone gets a blocking "reopen from your home screen" screen
//    (marked via the localStorage flag right before the redirect out);
//    everything else just continues into the app normally.
const MESSAGE_SOURCE = "app-oauth-callback";
const SESSION_WAIT_TIMEOUT_MS = 8000;

type Status = "waiting" | "popup-done" | "ios-standalone-blocked" | "error";

export function PopupCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("waiting");
  const settledRef = useRef(false);

  useEffect(() => {
    const isPopup = !!window.opener && window.opener !== window;

    function settle(ok: boolean) {
      if (settledRef.current) return;
      settledRef.current = true;

      if (isPopup) {
        try {
          window.opener.postMessage(
            { source: MESSAGE_SOURCE, ok },
            window.location.origin,
          );
        } catch {
          // opener อาจถูกปิด/navigate ออกไปแล้ว — เดี๋ยว popup.closed
          // polling ฝั่ง opener จะจับเอง
        }
        setStatus("popup-done");
        window.close();
        // เผื่อ window.close() ใช้ไม่ได้ (บาง browser บล็อกถ้า popup ไม่ได้
        // เปิดโดย script — ไม่ควรเกิดในเคสนี้ แต่กันไว้) เหลือข้อความสั้นๆ
        // ให้ปิดเองไว้ใน render ด้านล่าง
        return;
      }

      if (!ok) {
        setStatus("error");
        return;
      }

      if (consumeIosStandaloneOAuthFlag()) {
        setStatus("ios-standalone-blocked");
        return;
      }

      navigate({ to: "/", replace: true });
    }

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || (event === "INITIAL_SESSION" && session)) {
          settle(true);
        }
      },
    );

    // เผื่อ session มีอยู่แล้วตอน mount (onAuthStateChange อาจ fire ไปก่อน
    // listener ผูกเสร็จ)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) settle(true);
    });

    const timeout = window.setTimeout(() => settle(false), SESSION_WAIT_TIMEOUT_MS);

    return () => {
      subscription.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "ios-standalone-blocked") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-lg font-semibold">เข้าสู่ระบบสำเร็จ</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          กรุณาปิดแท็บนี้ แล้วเปิดแอปจากหน้าจอโฮมอีกครั้ง
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-lg font-semibold">เข้าสู่ระบบไม่สำเร็จ</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          กรุณาปิดแท็บนี้แล้วลองใหม่อีกครั้ง
        </p>
      </div>
    );
  }

  // "waiting" และ "popup-done" (เผื่อ window.close() ใช้ไม่ได้) แสดง
  // spinner เฉยๆ — popup ควรปิดตัวเองไปแล้วก่อนผู้ใช้ทันเห็นข้อความนี้
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Loader2 className="text-muted-foreground animate-spin" />
    </div>
  );
}
