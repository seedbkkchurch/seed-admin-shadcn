import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase/client";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

const CHANGE_PASSWORD_PATH = "/change-password";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }

    // บังคับเปลี่ยนรหัสผ่านตอน login ครั้งแรก — ทุกบัญชี bulk-created เริ่ม
    // จากรหัสผ่านเดียวกัน (raw_user_meta_data.must_change_password = true,
    // ตั้งใน migration rbac_bulk_create_lamb_auth_accounts) เด้งไปหน้า
    // /change-password ก่อนเข้าหน้าอื่นได้ ยกเว้น path นั้นเองกันเด้งวน —
    // ตกลงใน grill-me 2026-08-14 รอบเจ็ด (`auth_lamb_link_design`)
    const mustChangePassword =
      session.user.user_metadata?.must_change_password === true;
    if (mustChangePassword && location.pathname !== CHANGE_PASSWORD_PATH) {
      throw redirect({
        to: CHANGE_PASSWORD_PATH,
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});
