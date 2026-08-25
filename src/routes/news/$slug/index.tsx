import { createFileRoute } from "@tanstack/react-router";
import { NewsPublicDetail } from "@/features/news-public/news-public-detail";

// Public route — เหมือน news/index.tsx ไม่ต้อง login ก็เข้าได้ query
// ข้างในกรอง status='published' ผ่าน DB view เอง (usePublicNewsDetail)
// URL ใช้ slug (ไม่ใช่ id) ตามที่ตกลงใน grill-me 2026-08-25
export const Route = createFileRoute("/news/$slug/")({
  component: NewsPublicDetail,
});
