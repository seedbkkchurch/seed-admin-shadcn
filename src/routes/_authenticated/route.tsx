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

    // ตรวจว่า auth user นี้มีแถว lamb_info ผูกอยู่ไหม (ยกเว้นบัญชี
    // hardcoded super-admin ที่ตั้งใจไม่มี lamb_info โดยดีไซน์ — ดู
    // checkIsSuperAdmin() ใน features/user-roles/data/queries.ts) จำเป็น
    // ตั้งแต่เปิด Google provider (grill-me 2026-08-17): Supabase auto-links
    // ตาม email ที่ verified แล้วให้อัตโนมัติถ้า email ตรงกับบัญชี
    // bulk-created เดิม แต่ถ้า Google login ด้วย email ที่ไม่ตรงกับใครเลย
    // มันจะสร้าง auth.users ใหม่เปล่าๆ ให้ — login ผ่านได้แต่ไม่มี lamb_info
    // ผูก ทำให้ useMyLamb()/RBAC หาแถวไม่เจอและทุกหน้าใช้งานไม่ได้ กันไว้
    // ตรงนี้จุดเดียว (ครอบคลุมทุก route ใต้ _authenticated) — เจอแล้ว signOut
    // ทันทีแล้วเด้งไปหน้าแจ้งเตือน แทนที่จะปล่อยให้ไป error ทีหลัง
    const isHardcodedSuperAdmin =
      import.meta.env.VITE_SUPER_ADMIN_UID &&
      session.user.id === import.meta.env.VITE_SUPER_ADMIN_UID;

    if (!isHardcodedSuperAdmin) {
      const { data: lamb } = await supabase
        .from("lamb_info")
        .select("id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!lamb) {
        // สำคัญ: ห้าม await signOut() ตรงนี้ก่อน throw redirect — เจอ bug
        // จริงตอนทดสอบ (grill-me 2026-08-18) ว่า await signOut() ก่อน throw
        // ทำให้เกิด race กับ TanStack Router (auth state เปลี่ยนกลางทาง
        // ระหว่างรอ ทำให้ router re-evaluate _authenticated ซ้ำด้วย session
        // ที่เพิ่งว่างไปแล้ว ก่อน redirect ของเราจะ commit ผลคือหลุดไป
        // /sign-in แทน /unregistered) เปลี่ยนมาส่ง email ไปก่อนเฉยๆ แล้วให้
        // หน้า /unregistered เป็นคน signOut() เองตอน mount แทน — ไม่มี await
        // คั่นระหว่าง lamb_info check กับ throw redirect เลย ไม่มี race
        const attemptedEmail = session.user.email;
        throw redirect({
          to: "/unregistered",
          search: attemptedEmail ? { email: attemptedEmail } : undefined,
        });
      }
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
