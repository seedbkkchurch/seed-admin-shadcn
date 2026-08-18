import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

// Row shape from the generated Supabase schema — 1 lamb มีได้หลายรายการ,
// self-service (เจ้าของกรอกเอง ไม่ใช่ admin กรอกแทนแบบ lamb_devotion) ดู
// project memory `prayer_list_design` / docs/prayer-list-db-design.md
export type PrayerRequest = Tables<"lamb_prayer_request">;

export type PrayerEntryType = PrayerRequest["type"];

export const PRAYER_ENTRY_TYPE_LABEL: Record<PrayerEntryType, string> = {
  prayer: "คำอธิษฐาน",
  conversation: "สิ่งที่พระเจ้าคุยด้วย",
};

export const PRAYER_ENTRY_TYPES = ["prayer", "conversation"] as const;

export type PrayerRequestCreateInput = Pick<
  TablesInsert<"lamb_prayer_request">,
  "lamb_id" | "type" | "title" | "detail" | "is_shared"
>;

export type PrayerRequestUpdateInput = Partial<
  Pick<TablesUpdate<"lamb_prayer_request">, "title" | "detail" | "is_shared">
>;

// จำนวนวัน "รอ" ตั้งแต่วันที่กรอกจนถึงวันที่พระเจ้าตอบ — เฉพาะรายการที่
// ติ๊กตอบแล้วเท่านั้น (ตกลงใน grill-me: รายการที่ยังไม่ตอบไม่ต้องนับถอยหลัง)
// คำนวณฝั่งแอปล้วนๆ ไม่เก็บเป็นคอลัมน์ใน DB — ทั้งสองค่าเทียบกันแบบ "วันที่
// ปฏิทิน" (ไม่สนเวลา) ด้วย differenceInCalendarDays ของ date-fns ตรงกับที่
// devotion_date ใช้อยู่แล้วในโปรเจกต์นี้
export function prayerDurationDays(
  request: Pick<PrayerRequest, "created_at" | "answered_date">,
): number | null {
  if (!request.answered_date) return null;
  const created = parseISO(request.created_at);
  const answered = parseISO(request.answered_date);
  return Math.max(0, differenceInCalendarDays(answered, created));
}
