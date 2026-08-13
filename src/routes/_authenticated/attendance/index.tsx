import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { Attendance } from "@/features/attendance";

// group/week sync ลง URL search params เพื่อไม่ให้เสีย state ตอนกดดูโปรไฟล์แล้ว
// กด back กลับมา (ดู `docs/attendance-db-design.md` — grill-me 2026-08-13)
// `all` = โหมด "แสดงทั้งหมด" (สรุปตัวเลขรวมทุกกลุ่มแคร์ แทนตารางรายคนของกลุ่ม
// เดียว) — เป็นอิสระจาก `group`, ยังใช้ `week` ร่วมกัน (ดู grill-me 2026-08-13)
const attendanceSearchSchema = z.object({
  group: z.string().optional().catch(undefined),
  week: z.string().optional().catch(undefined),
  all: z.boolean().optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/attendance/")({
  validateSearch: attendanceSearchSchema,
  component: Attendance,
});
