import { createFileRoute } from "@tanstack/react-router";
import { BibleMusic } from "@/features/bible-music";

// หน้าเพลงตอนอ่านพระคัมภีร์ — ทุกคนที่ล็อกอินเข้าได้ (เปลี่ยนจาก super_admin
// เท่านั้น, grill-me 2026-11-20) ฟอร์มเพิ่มเพลงโชว์เฉพาะคนมี music:add ปุ่ม
// ลบ/เปิดปิด/เรียงลำดับโชว์เฉพาะคนมี music:manage — RLS กันอีกชั้น
export const Route = createFileRoute("/_authenticated/bible-music/")({
  component: BibleMusic,
});
