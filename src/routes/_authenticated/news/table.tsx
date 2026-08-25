import z from "zod";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkCanWriteNews } from "@/features/news/data/queries";
import { NewsTablePage } from "@/features/news/news-table-page";

const newsTableSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(""),
  status: z
    .array(z.enum(["draft", "published", "archived"]))
    .optional()
    .catch([]),
});

// Permission-gated — เฉพาะคนมี news:write (team_leader/admin/super_admin)
// เหมือน routes/_authenticated/user-roles ที่เช็ค checkIsSuperAdmin
// (redirect /403 ก่อนหน้านี้จะ render เลย กัน RLS-blocked write UI โผล่มา
// เปล่าๆ) ดู migration news_feature_init สำหรับ RLS ที่บังคับซ้ำที่ DB
export const Route = createFileRoute("/_authenticated/news/table")({
  validateSearch: newsTableSearchSchema,
  beforeLoad: async () => {
    const canWrite = await checkCanWriteNews();
    if (!canWrite) {
      throw redirect({ to: "/403" });
    }
  },
  component: NewsTablePage,
});
