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
  andrew: "รายชื่อแอนดรู",
};

export const PRAYER_ENTRY_TYPES = ["prayer", "conversation", "andrew"] as const;

// ข้อความที่ต่างกันตามประเภท — แท็บ "แอนดรู" (เพิ่ม 2026-10-28 จาก grill-me)
// ใช้ตาราง/ฟิลด์เดิมทั้งหมด: title = ชื่อคนที่อธิษฐานเผื่อ, detail = หมายเหตุ,
// is_answered/answered_date = "รับเชื่อแล้ว" แทน "พระเจ้าตอบแล้ว"
type PrayerEntryTypeCopy = {
  dialogDescription: string;
  titleLabel: string;
  titlePlaceholder: string;
  detailLabel: string;
  answeredAriaLabel: string;
  answeredOnLabel: string;
  answeredAskDate: string;
  answeredToast: string;
};

const DEFAULT_COPY = {
  titleLabel: "หัวข้อ",
  titlePlaceholder: "เช่น สุขภาพคุณแม่",
  detailLabel: "รายละเอียด (ไม่บังคับ)",
  answeredAriaLabel: "พระเจ้าตอบแล้ว",
  answeredOnLabel: "พระเจ้าตอบเมื่อ",
  answeredAskDate: "พระเจ้าตอบวันไหน?",
  answeredToast: "บันทึกว่าพระเจ้าตอบแล้ว",
};

export const PRAYER_ENTRY_TYPE_COPY: Record<PrayerEntryType, PrayerEntryTypeCopy> = {
  prayer: {
    ...DEFAULT_COPY,
    dialogDescription: "จดสิ่งที่อธิษฐานเผื่อ แล้วกลับมาติ๊กเมื่อพระเจ้าตอบ",
  },
  conversation: {
    ...DEFAULT_COPY,
    dialogDescription: "จดสิ่งที่พระเจ้าพูดหรือสื่อกับคุณ",
  },
  andrew: {
    dialogDescription:
      "จดชื่อคนที่คุณอธิษฐานเผื่อให้รู้จักพระเจ้า แล้วกลับมาติ๊กเมื่อเขารับเชื่อ",
    titleLabel: "ชื่อ",
    titlePlaceholder: "เช่น พี่สมชาย (เพื่อนที่ทำงาน)",
    detailLabel: "หมายเหตุ (ไม่บังคับ)",
    answeredAriaLabel: "รับเชื่อแล้ว",
    answeredOnLabel: "รับเชื่อเมื่อ",
    answeredAskDate: "รับเชื่อวันไหน?",
    answeredToast: "บันทึกว่ารับเชื่อแล้ว",
  },
};

export type PrayerRequestCreateInput = Pick<
  TablesInsert<"lamb_prayer_request">,
  "lamb_id" | "type" | "title" | "detail" | "is_shared" | "icon"
>;

export type PrayerRequestUpdateInput = Partial<
  Pick<
    TablesUpdate<"lamb_prayer_request">,
    "title" | "detail" | "is_shared" | "photo_path" | "icon"
  >
>;

// แท็บที่มีรูปคนประกอบ — ตอนนี้เฉพาะแอนดรู (grill-me 2026-10-28)
export function prayerTypeHasPhoto(type: PrayerEntryType): boolean {
  return type === "andrew";
}

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
