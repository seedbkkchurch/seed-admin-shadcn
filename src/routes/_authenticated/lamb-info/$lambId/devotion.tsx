import { createFileRoute, redirect } from "@tanstack/react-router";
import { LambDevotionTablePage } from "@/features/lamb-info/lamb-devotion-table-page";
import { checkCanAccessLambProfile } from "@/features/user-roles/data/queries";

export const Route = createFileRoute(
  "/_authenticated/lamb-info/$lambId/devotion",
)({
  // Same guard as the profile page (`$lambId/index.tsx`) — member/visitor
  // ดูประวัติเฝ้าเดี่ยวเต็มได้แค่ของตัวเอง เดิมหน้านี้ไม่มี guard เลย ทั้งที่
  // เป็นข้อมูลส่วนตัวเหมือนกัน (grill-me 2026-08-30)
  beforeLoad: async ({ params }) => {
    const canAccess = await checkCanAccessLambProfile(params.lambId);
    if (!canAccess) {
      throw redirect({ to: "/403" });
    }
  },
  component: LambDevotionTablePage,
});
