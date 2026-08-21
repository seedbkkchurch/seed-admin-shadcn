import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkIsSuperAdmin } from "@/features/user-roles/data/queries";
import { BibleApiTester } from "@/features/bible-api-tester";

export const Route = createFileRoute("/_authenticated/bible-api-tester/")({
  // Dev tool เท่านั้น (ดู grill-me 2026-08-20) — gate เหมือน /user-roles กับ
  // /permissions คือใช้ checkIsSuperAdmin() ตรงๆ ไม่ได้ผูกกับ role_permissions
  // matrix เพราะ pattern จริงของกลุ่มเมนู Admin ทั้งกลุ่ม (superAdminOnly ใน
  // sidebar-data.ts) ก็ยังไม่มี route ไหนใน Admin ใช้ auth_has_permission()
  // จริงๆ สักที่ — เพิ่ม permission key ใหม่เข้า matrix ที่ไม่มีโค้ดไหน check
  // จะกลายเป็นแค่ row เปล่าๆ ที่ทำให้เข้าใจผิดว่ามีผลจริง จึงเลือก consistent
  // กับของเดิมแทน
  beforeLoad: async () => {
    const isSuperAdmin = await checkIsSuperAdmin();
    if (!isSuperAdmin) {
      throw redirect({ to: "/403" });
    }
  },
  component: BibleApiTester,
});
