import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { BibleLive } from "@/features/bible-live";

// เหมือน /bible เดิม (ต้อง login แต่ไม่ต้อง super_admin) — ต่างกันแค่แหล่ง
// ข้อมูลเป็น live API แทนไฟล์ static (ดู grill-me 2026-08-20) bibleId เก็บใน
// URL search เพื่อแชร์ลิงก์แล้วเปิดฉบับ/บทเดิมได้ทันที
//
// z.coerce.string() (ไม่ใช่ z.string() เฉยๆ) — TanStack Router parse ค่าใน
// query string ที่หน้าตาเป็นตัวเลข (เช่น ?bibleId=179) เป็น JS number
// อัตโนมัติ ไม่ใช่ string ถ้าใช้ z.string().optional() เฉยๆ จะ throw
// SearchParamError ทันทีตอนโหลดหน้า (เจอ bug จริงตอนทดสอบ — แก้ 2026-08-21)
// bible id จาก YouVersion เป็นตัวเลขล้วนเสมอในตัวอย่างที่เจอ แต่เก็บเป็น
// string ในโค้ดฝั่งเราเพราะใช้ต่อ URL path ตรงๆ (`bibles/${bibleId}/...`)
const bibleLiveSearchSchema = z.object({
  bibleId: z.coerce.string().optional(),
});

export const Route = createFileRoute(
  "/_authenticated/bible-live/$book/$chapter/",
)({
  validateSearch: bibleLiveSearchSchema,
  component: BibleLive,
});
