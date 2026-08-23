import { z } from "zod";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { LambInfo } from "@/features/lamb-info";
import { checkIsLambAccessRestricted } from "@/features/user-roles/data/queries";

const lambInfoSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  nickName: z.string().optional().catch(""),
});

export const Route = createFileRoute("/_authenticated/lamb-info/")({
  validateSearch: lambInfoSearchSchema,
  // รายชื่อลูกแกะหลายคน — member/visitor ดูได้แค่ profile ตัวเอง ไม่ใช่
  // รายการทั้งหมดนี้ (ดู sidebar-data.ts hiddenForRoles + grill-me
  // 2026-08-23) กันซ้ำที่ route ด้วยเผื่อพิมพ์ URL ตรงๆ
  beforeLoad: async () => {
    if (await checkIsLambAccessRestricted()) {
      throw redirect({ to: "/403" });
    }
  },
  component: LambInfo,
});
