import { createFileRoute } from "@tanstack/react-router";
import { BibleProgressPage } from "@/features/bible/progress";

// ความคืบหน้าการอ่านพระคัมภีร์ของตัวเอง (grill-me 2026-11-16) — path ช่วงเดียว
// ไม่ชนกับ /bible/$book/$chapter ที่มีสองช่วง
export const Route = createFileRoute("/_authenticated/bible/progress")({
  component: BibleProgressPage,
});
