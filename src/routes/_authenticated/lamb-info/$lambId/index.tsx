import { createFileRoute, redirect } from "@tanstack/react-router";
import { LambInfoProfile } from "@/features/lamb-info/profile";
import { checkCanAccessLambProfile } from "@/features/user-roles/data/queries";

export const Route = createFileRoute("/_authenticated/lamb-info/$lambId/")({
  // member/visitor ดูได้แค่ profile ตัวเอง (lambId ตรงกับของตัวเองเท่านั้น)
  // — คนอื่น (admin/team_leader/cell_leader/super_admin) ดูได้ทุกโปรไฟล์
  // เหมือนเดิม (ดู sidebar-data.ts hiddenForRoles + grill-me 2026-08-23)
  beforeLoad: async ({ params }) => {
    const canAccess = await checkCanAccessLambProfile(params.lambId);
    if (!canAccess) {
      throw redirect({ to: "/403" });
    }
  },
  component: LambInfoProfile,
});
