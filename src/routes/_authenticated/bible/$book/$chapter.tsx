import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { BiblePage } from "@/features/bible";

// ย้ายมาอยู่ใต้ `_authenticated` แล้ว (ต้อง login + มีเมนู sidebar) — ตอนแรก
// เป็น public แต่ผู้ใช้เปลี่ยนใจภายหลัง (ดู grill-me 2026-08-13,
// เปลี่ยนใจ 2026-08-13) ไฟล์เดิมที่ src/routes/bible/ ไม่ได้ใช้แล้ว
// lang sync ลง URL search (?lang=th|en|both) เหมือนเดิม
// strongs = โหมดปิด hover/tap คำ Strong's ฮีบรู/กรีก ทั้งหมด — undefined/true
// = เปิด (ค่าเริ่มต้น), false = ปิด กลายเป็นข้อความธรรมดา (ดู grill-me
// 2026-08-13)
const bibleSearchSchema = z.object({
  lang: z.enum(["th", "en", "both"]).optional().catch(undefined),
  strongs: z.boolean().optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/bible/$book/$chapter")({
  validateSearch: bibleSearchSchema,
  component: BiblePage,
});
