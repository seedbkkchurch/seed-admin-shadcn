import { createFileRoute } from "@tanstack/react-router";
import { NewsPublicFeed } from "@/features/news-public/news-public-feed";

// Public route (นอก _authenticated ทั้งหมด — ไม่มี beforeLoad เช็ค session
// เลย) เหมือน routes/devotion/index.tsx ทุกประการ ตกลงใน grill-me
// 2026-08-25 ให้ข่าวเปิดสาธารณะเหมือนเฝ้าเดี่ยว
export const Route = createFileRoute("/news/")({
  component: NewsPublicFeed,
});
