import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkHasLinkedLamb } from "@/features/user-roles/data/queries";

// "/" ไม่มีหน้าของตัวเองแล้ว — หน้าแรกของทุกคนคือ "จิตวิญญาณของฉัน"
// (/spiritual) ไม่ว่า role ไหน (grill-me 2026-11-19, เดิม 2026-11-15 เป็นของ
// member/visitor เท่านั้น) ยกเว้นบัญชีที่ไม่ผูกกับลูกแกะ (ไม่มีข้อมูลส่วนตัวให้
// แสดง) ที่ยังไป Dashboard ภาพรวมคริสตจักร (/dashboard) Dashboard ภาพรวมยังเข้า
// ได้จากเมนู Dashboard ของทุก role ตามปกติ
export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: async () => {
    throw redirect({
      to: (await checkHasLinkedLamb()) ? "/spiritual" : "/dashboard",
      replace: true,
    });
  },
});
