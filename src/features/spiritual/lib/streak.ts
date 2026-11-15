import { addDays, format, parseISO, subDays } from "date-fns";

const key = (date: Date) => format(date, "yyyy-MM-dd");

// วันต่อเนื่องของเฝ้าเดี่ยว จากเซ็ตของวันที่ที่ส่ง (yyyy-MM-dd, เฉพาะประเภท
// "เฝ้าเดี่ยว" เหมือนสถิติอื่นของระบบ):
// - current: นับถอยหลังจากวันนี้ ถ้าวันนี้ยังไม่ได้ส่งให้เริ่มนับจากเมื่อวาน
//   (สถิติยังไม่ขาดจนกว่าจะหมดวันนี้)
// - best: ช่วงต่อเนื่องที่ยาวที่สุดเท่าที่เคยทำได้
export function computeDevotionStreak(days: Set<string>, today: Date) {
  let cursor = days.has(key(today)) ? today : subDays(today, 1);
  let current = 0;
  while (days.has(key(cursor))) {
    current++;
    cursor = subDays(cursor, 1);
  }

  let best = 0;
  for (const day of days) {
    // เริ่มนับเฉพาะจากวันแรกของแต่ละช่วง (วันก่อนหน้าไม่มี)
    if (days.has(key(subDays(parseISO(day), 1)))) continue;
    let length = 1;
    let next = addDays(parseISO(day), 1);
    while (days.has(key(next))) {
      length++;
      next = addDays(next, 1);
    }
    best = Math.max(best, length);
  }

  return { current, best: Math.max(best, current) };
}
