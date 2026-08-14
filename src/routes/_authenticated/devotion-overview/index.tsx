import { createFileRoute } from "@tanstack/react-router";
import { DevotionOverview } from "@/features/devotion-overview";

// Fixed rolling windows (เดือนนี้ / 12 เดือนล่าสุด) ไม่มีตัวเลือกเลื่อนเดือน/ปี
// จึงไม่ต้องมี validateSearch เหมือน /attendance (ดู grill-me 2026-08-14,
// `devotion_overview_design` ใน project memory)
export const Route = createFileRoute("/_authenticated/devotion-overview/")({
  component: DevotionOverview,
});
