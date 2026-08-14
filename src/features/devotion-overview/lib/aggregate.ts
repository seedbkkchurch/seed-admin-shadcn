import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  startOfMonth,
  subMonths,
} from "date-fns";

// สรุปดีไซน์นี้มาจาก grill-me 2026-08-14 (`devotion_overview_design` ใน
// project memory) — ปัญหาหลักที่ต้องแก้คือ "จำนวนครั้งดิบเทียบกันไม่ได้"
// เพราะแต่ละเดือน/สัปดาห์มีจำนวนวันไม่เท่ากัน ทางแก้ที่ตกลงกัน:
//
// 1. ตัวเลขหลักที่โชว์ทุกช่องคือ "อัตรา %" ไม่ใช่จำนวนครั้งดิบ
// 2. denominator = จำนวนวันที่ "ผ่านไปแล้วจริง" ในช่วงนั้น (ไม่นับวันในอนาคต)
//    ไม่หักช่วงก่อนสมาชิกเข้าโบส (นับเต็มช่วงเสมอ ตามที่ตกลง)
// 3. สัปดาห์ในตารางรายเดือนใช้ "week-of-month" แบบมาตรฐาน (จันทร์/อาทิตย์เป็น
//    วันเริ่ม สัปดาห์แรก/สัปดาห์สุดท้ายอาจมีไม่ครบ 7 วันถ้าเดือนไม่ได้เริ่ม/จบ
//    วันอาทิตย์พอดี) → จำนวนคอลัมน์ยืดหด 4-6 คอลัมน์ตามจริง ไม่มีคอลัมน์ Week 5
//    ว่างเปล่าโผล่มาเวลาเดือนนั้นมีแค่ 4 สัปดาห์เต็ม (ตกลงใน grill-me ข้อ
//    "week ที่ไม่มีอยู่จริง")

export type RateBucket = {
  label: string;
  count: number;
  elapsedDays: number;
  totalDays: number;
  // null = ช่วงนี้ยังไม่เริ่มเลย (อยู่ในอนาคตทั้งหมด) — โชว์ "–" แทน 0%
  percent: number | null;
};

const DATE_FMT = "yyyy-MM-dd";

function elapsedDaysInRange(start: Date, end: Date, today: Date): number {
  if (isAfter(start, today)) return 0;
  const clippedEnd = isAfter(end, today) ? today : end;
  return eachDayOfInterval({ start, end: clippedEnd }).length;
}

function countEntriesInDays(
  days: Date[],
  today: Date,
  entryDates: Set<string>,
): number {
  return days.filter(
    (d) => !isAfter(d, today) && entryDates.has(format(d, DATE_FMT)),
  ).length;
}

function toPercent(count: number, elapsedDays: number): number | null {
  if (elapsedDays === 0) return null;
  return Math.round((count / elapsedDays) * 100);
}

// สัปดาห์ของเดือนที่ระบุ แบบ "week-of-month" (อาทิตย์ = วันเริ่มสัปดาห์ ตรงกับ
// week_start ที่ใช้ในหน้าเช็คชื่อรายสัปดาห์ — ดู attendance-db-design.md) —
// จำนวนสัปดาห์ที่คืนกลับมายืดหดตามจริง (4-6 สัปดาห์) ไม่ pad ให้ครบ 5 เสมอ
export function buildMonthlyWeeks(
  monthDate: Date,
  entryDates: Set<string>,
  today: Date,
): RateBucket[] {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const firstWeekdayOffset = getDay(monthStart); // 0 = อาทิตย์

  const daysByWeek = new Map<number, Date[]>();
  for (const day of eachDayOfInterval({ start: monthStart, end: monthEnd })) {
    const weekIndex = Math.floor(
      (day.getDate() - 1 + firstWeekdayOffset) / 7,
    );
    const list = daysByWeek.get(weekIndex) ?? [];
    list.push(day);
    daysByWeek.set(weekIndex, list);
  }

  return Array.from(daysByWeek.entries())
    .sort(([a], [b]) => a - b)
    .map(([, days], i) => {
      const weekStart = days[0];
      const weekEnd = days[days.length - 1];
      const elapsedDays = elapsedDaysInRange(weekStart, weekEnd, today);
      const count = countEntriesInDays(days, today, entryDates);
      return {
        label: `สัปดาห์ ${i + 1}`,
        count,
        elapsedDays,
        totalDays: days.length,
        percent: toPercent(count, elapsedDays),
      };
    });
}

// 12 เดือนล่าสุดแบบ rolling จบที่เดือนปัจจุบัน (ไม่มีตัวเลือกเลื่อนปี — เดียวกับ
// DevotionMonthlyChart ที่มีอยู่แล้วในหน้าโปรไฟล์รายคน)
export function buildYearlyMonths(
  today: Date,
  entryDates: Set<string>,
): RateBucket[] {
  const months: RateBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(startOfMonth(today), i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const elapsedDays = elapsedDaysInRange(monthStart, monthEnd, today);
    const count = countEntriesInDays(days, today, entryDates);
    months.push({
      label: format(monthDate, "MMM"),
      count,
      elapsedDays,
      totalDays: days.length,
      percent: toPercent(count, elapsedDays),
    });
  }
  return months;
}

// เฉลี่ยของ bucket ที่ "เริ่มแล้ว" เท่านั้น (elapsedDays > 0) — ใช้กับคอลัมน์
// "เฉลี่ยทั้งปี" ต่อคน และ stat card สรุปทั้งโบส
export function averagePercent(buckets: RateBucket[]): number | null {
  const started = buckets.filter((b) => b.percent !== null);
  if (started.length === 0) return null;
  const totalCount = started.reduce((sum, b) => sum + b.count, 0);
  const totalElapsed = started.reduce((sum, b) => sum + b.elapsedDays, 0);
  return toPercent(totalCount, totalElapsed);
}
