import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkIsMemberOrVisitor } from "@/features/user-roles/data/queries";

// "/" ไม่มีหน้าของตัวเองแล้ว — เลือกหน้าแรกตาม role (grill-me 2026-11-15):
// member/visitor → dashboard จิตวิญญาณของตัวเอง (/spiritual), role อื่น
// (รวมบัญชีที่ไม่ผูกกับลูกแกะ) → Dashboard ภาพรวมคริสตจักร (/dashboard)
// member/visitor ยังเข้า /dashboard ได้จากเมนู Dashboard ตามปกติ
export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: async () => {
    throw redirect({
      to: (await checkIsMemberOrVisitor()) ? "/spiritual" : "/dashboard",
      replace: true,
    });
  },
});
