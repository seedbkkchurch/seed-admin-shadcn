import { createFileRoute } from "@tanstack/react-router";
import { MentorshipChart } from "@/features/mentorship/chart";

// ผังพี่เลี้ยงทั้งคริสตจักร — ทุกคนที่ login แล้วดูได้ (read-only) ไม่ gate
// role ต่างจาก /mentorship (หน้าแก้ไข) ดู grill-me 2026-08-28
export const Route = createFileRoute("/_authenticated/mentorship-chart")({
  component: MentorshipChart,
});
