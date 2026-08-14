import type { Tables } from "@/lib/supabase/database.types";

// สมาชิก active ที่โชว์ในหน้าภาพรวมเฝ้าเดี่ยว — first_name/last_name override
// เป็น non-null ตามธรรมเนียมเดิมของโปรเจกต์ (ดู lamb-info/data/schema.ts,
// attendance/data/schema.ts และ grill-me 2026-08-12, `supabase_generated_types`)
export type DevotionOverviewMember = Pick<
  Tables<"lamb_info">,
  "id" | "nick_name" | "profile_picture" | "gender"
> & {
  first_name: string;
  last_name: string;
  group_care_info: { id: string; name: string } | null;
};

// เฉพาะคอลัมน์ที่ต้องใช้ aggregate เป็นรายสัปดาห์/เดือน — ไม่ต้อง join
// lamb_info ซ้ำ (คู่กับ members query แยกต่างหาก)
export type DevotionOverviewEntry = Pick<
  Tables<"lamb_devotion">,
  "lamb_id" | "devotion_date"
>;
