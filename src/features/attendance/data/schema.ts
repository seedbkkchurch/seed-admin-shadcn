import type { Tables } from "@/lib/supabase/database.types";

export type AttendanceLogRow = Tables<"lamb_attendance_log">;

// สมาชิกของกลุ่มแคร์ที่เลือก ใช้แสดงแต่ละแถวในตาราง attendance —
// first_name/last_name override เป็น non-null ตามธรรมเนียมเดิมของโปรเจกต์ (ดู
// group-care/data/schema.ts และ grill-me 2026-08-12, `supabase_generated_types`)
export type AttendanceMember = Pick<
  Tables<"lamb_info">,
  "id" | "nick_name" | "profile_picture" | "group_care"
> & {
  first_name: string;
  last_name: string;
};

// เฉพาะคอลัมน์ที่หน้า attendance ต้องใช้จริง
export type AttendanceRow = Pick<
  AttendanceLogRow,
  | "id"
  | "lamb_id"
  | "week_start"
  | "came_to_church"
  | "came_to_group_care"
  | "note"
>;
