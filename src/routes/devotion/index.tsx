import { createFileRoute } from "@tanstack/react-router";
import { DevotionPublicFeed } from "@/features/devotion-public/devotion-public-feed";

// Public route (นอก _authenticated ทั้งหมด — ไม่มี beforeLoad เช็ค session
// เลย) ดู grill-me 2026-08-16 "เฝ้าเดียวทำให้สามารถเห็นได้โดยไม่ต้อง login"
export const Route = createFileRoute("/devotion/")({
  component: DevotionPublicFeed,
});
