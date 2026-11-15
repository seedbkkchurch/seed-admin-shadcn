import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/features/dashboard";

// Dashboard ภาพรวมคริสตจักร — ย้ายมาจาก "/" (grill-me 2026-11-15) เพราะ "/"
// กลายเป็นตัวเลือกหน้าแรกตาม role แล้ว (ดู ../index.tsx) ทุก role ยังเข้าหน้า
// นี้ได้จากเมนู Dashboard เหมือนเดิม
export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Dashboard,
});
