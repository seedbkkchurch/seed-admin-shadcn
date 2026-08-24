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
// version = ฉบับพระคัมภีร์ (kjv/niv/esv/erv/tcv) — เดิม (2026-08-21..24) แยก
// เป็น enVersion/thVersion สองพารามิเตอร์ ผู้ใช้ขอเปลี่ยนใหม่ (grill-me
// 2026-08-24 รอบ 2 "เปลี่ยน กดเลือกภาษาก่อน แล้วจะแสดง dropdown bible") ให้
// เหลือ ?version= เดียว — ไม่เก็บ backward-compat กับ enVersion/thVersion
// เดิม (ผู้ใช้ยืนยัน ฟีเจอร์เพิ่งเพิ่มมายังไม่ทันแชร์ลิงก์เก่าไปไหน)
// undefined = kjv (ค่าเริ่มต้น) — เพิ่ม "tcv" เข้า enum ตอนเพิ่มฉบับ TCV
// (2026-08-24 รอบ 3) แต่ลืมแก้ไฟล์นี้ตอนนั้น ทำให้เลือก TCV แล้ว zod
// validateSearch ปัดตกค่า "tcv" ทิ้งทันที (ไม่อยู่ใน enum เดิม) เด้งกลับไป
// undefined -> kjv ทุกครั้ง (ดู index.tsx: `search.version ?? "kjv"`) เป็น
// บั๊ก "เลือก TCV ไม่ได้" ที่ผู้ใช้รายงาน — แก้โดยเพิ่ม "tcv" เข้า enum —
// เพิ่ม "tncv" เข้า enum ทันทีตอนเพิ่มฉบับ TNCV (2026-08-24 รอบ 6) เพื่อไม่
// ให้เจอบั๊กเดิมซ้ำ
const bibleSearchSchema = z.object({
  lang: z.enum(["th", "en", "both"]).optional().catch(undefined),
  strongs: z.boolean().optional().catch(undefined),
  version: z
    .enum(["kjv", "niv", "esv", "erv", "tcv", "tncv"])
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/_authenticated/bible/$book/$chapter")({
  validateSearch: bibleSearchSchema,
  component: BiblePage,
});
