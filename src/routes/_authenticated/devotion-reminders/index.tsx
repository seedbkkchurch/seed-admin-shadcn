import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkIsSuperAdmin } from "@/features/user-roles/data/queries";
import { DevotionReminderAdmin } from "@/features/devotion-reminder-admin";

export const Route = createFileRoute("/_authenticated/devotion-reminders/")({
  // แผงนี้ตั้งเวลา + broadcast แจ้งเตือนหาทุกคนพร้อมกัน ความเสี่ยงสูงกว่า
  // แค่ดูข้อมูล เลยเข้มงวดเท่า /user-roles กับ /permissions — ตกลงใน
  // grill-me 2026-08-18
  beforeLoad: async () => {
    const isSuperAdmin = await checkIsSuperAdmin();
    if (!isSuperAdmin) {
      throw redirect({ to: "/403" });
    }
  },
  component: DevotionReminderAdmin,
});
