import { createFileRoute } from "@tanstack/react-router";
import { DevotionPublicDetail } from "@/features/devotion-public/devotion-public-detail";

// Public route — เหมือน devotion/index.tsx ไม่ต้อง login ก็เข้าได้ แต่
// query ข้างในกรอง is_public=true เอง (usePublicLambDevotionDetail) ถ้าเป็น
// รายการ private หรือ id ไม่มีจริงจะเจอ error state เดียวกับ "ไม่พบ" ปกติ
// ดู grill-me 2026-08-16
export const Route = createFileRoute("/devotion/$devotionId/")({
  component: DevotionPublicDetail,
});
