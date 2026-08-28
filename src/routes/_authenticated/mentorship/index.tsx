import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkCanEditMentor } from "@/features/mentorship/data/queries";
import { Mentorship } from "@/features/mentorship";

// หน้าจัดการพี่เลี้ยง-ลูกแกะ — permission-gated เหมือน /news/table,
// /user-roles (redirect /403 ก่อน render กัน RLS-open write UI โผล่มาเปล่าๆ
// ให้คนไม่มีสิทธิ์เห็น) ดู grill-me 2026-08-28
export const Route = createFileRoute("/_authenticated/mentorship/")({
  beforeLoad: async () => {
    const canEdit = await checkCanEditMentor();
    if (!canEdit) {
      throw redirect({ to: "/403" });
    }
  },
  component: Mentorship,
});
