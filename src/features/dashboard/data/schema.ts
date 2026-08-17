import type { Tables } from "@/lib/supabase/database.types";

// ข้อมูลแกะสำหรับสรุปภาพรวมบน Dashboard — ดึงทุกแถวไม่กรอง status เพราะ
// "สมาชิกทั้งหมด" ต้องนับรวม inactive ด้วย (ต่างจาก devotion-overview ที่ดึง
// เฉพาะ active) ดู grill-me 2026-08-14, `dashboard_design` ใน project memory.
//
// first_name/last_name override เป็น non-null ตามธรรมเนียมเดิมของโปรเจกต์
// (ดู lamb-info/data/schema.ts และ grill-me 2026-08-12, `supabase_generated_types`)
export type DashboardLamb = Omit<
  Pick<
    Tables<"lamb_info">,
    | "id"
    | "first_name"
    | "last_name"
    | "nick_name"
    | "profile_picture"
    | "gender"
    | "birthday"
    | "status"
    | "role"
    | "tags"
    | "interesting"
    | "group_care"
    | "personality_code"
    | "lamb_lesson_ch18_progress"
    | "lamb_lesson_life_progress"
  >,
  "first_name" | "last_name"
> & {
  first_name: string;
  last_name: string;
};

// สำหรับกราฟเทรนด์มาโบสถ์/แคร์ — เฉพาะคอลัมน์ที่ต้อง aggregate รายสัปดาห์
export type DashboardAttendanceRow = Pick<
  Tables<"lamb_attendance_log">,
  "week_start" | "came_to_church" | "came_to_group_care"
>;

// code -> archetype สำหรับกราฟบุคลิกภาพ (join กับ lamb_info.personality_code
// ฝั่ง client แทนการ join ผ่าน Supabase embedded resource เพราะดึงทั้ง 2
// ตารางแยกกันอยู่แล้ว — เล็กพอที่จะ map ฝั่ง client)
export type DashboardPersonalityType = Pick<
  Tables<"personality_type">,
  "code" | "archetype"
>;

// ต้องดึง id+name (ไม่ใช่แค่ count) เพราะต้องกรองแถว sentinel/placeholder
// "all"/"none" ออกก่อนนับจำนวนกลุ่มจริง — ดู grill-me 2026-08-14 รอบสาม
// (`dashboard_design`) และ SENTINEL_GROUP_NAMES ใน lib/aggregate.ts
export type DashboardGroupCare = Pick<Tables<"group_care">, "id" | "name">;
