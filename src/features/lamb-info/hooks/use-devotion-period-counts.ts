import { useMemo, useState } from "react";
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { useLambDevotionActivity } from "../data/queries";

// ตัวนับ อาทิตย์นี้ / เดือนนี้ / ปีนี้ ที่ใช้ร่วมกันระหว่างกล่องตัวเลข
// (devotion-stat-tiles.tsx) และการ์ดแชร์สถิติ (devotion-stats-share-card.tsx)
// ให้ตัวเลขสองที่ตรงกันเสมอ (2026-11-08):
// - อ่านจาก view lamb_devotion_activity (รวมรายการส่วนตัว)
// - นับเฉพาะ content_type = "devotion" (ไม่นับคำเทศนา)
// - นับเป็น "จำนวนวันที่มีเฝ้าเดี่ยว" (ส่งหลายอันในวันเดียวนับ 1)
// - ช่วงเวลาเป็นปฏิทิน: อาทิตย์ จ–อา (weekStartsOn: 1 — ตามที่ขอ 2026-11-08
//   ต่างจากหน้าเช็คชื่อที่เริ่มวันอาทิตย์), เดือนปฏิทิน, ปีปฏิทิน
export function useDevotionPeriodCounts(lambId: string) {
  const [today] = useState(() => new Date());
  const { data: activity, isPending } = useLambDevotionActivity(lambId);

  const result = useMemo(() => {
    const days = new Set(
      (activity ?? [])
        .filter((e) => e.content_type === "devotion")
        .map((e) => e.devotion_date),
    );
    const countBetween = (start: Date, end: Date) => {
      const from = format(start, "yyyy-MM-dd");
      const to = format(end, "yyyy-MM-dd");
      let n = 0;
      for (const d of days) if (d >= from && d <= to) n++;
      return n;
    };
    return {
      devotionDays: days,
      week: countBetween(
        startOfWeek(today, { weekStartsOn: 1 }),
        endOfWeek(today, { weekStartsOn: 1 }),
      ),
      month: countBetween(startOfMonth(today), endOfMonth(today)),
      year: countBetween(startOfYear(today), endOfYear(today)),
    };
  }, [activity, today]);

  return { ...result, today, isPending };
}
