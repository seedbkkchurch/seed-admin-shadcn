import { createFileRoute } from "@tanstack/react-router";
import { Subscribe } from "@/features/subscribe";

// ย้ายมาจาก route public เดิม (src/routes/subscribe.tsx, นอก _authenticated)
// — ตอนนี้ต้อง login ก่อนถึงเข้าได้ เพราะหน้านี้ auto-detect ลูกแกะจาก
// auth_user_id แทนการให้เลือกชื่อเอง (ตกลงใน grill-me 2026-08-14 รอบเจ็ด,
// `rbac_design`/`auth_lamb_link_design`) — URL ยังเป็น /subscribe เหมือนเดิม
// (path ไม่เปลี่ยนเพราะ _authenticated เป็น pathless layout route)
export const Route = createFileRoute("/_authenticated/subscribe/")({
  component: Subscribe,
});
