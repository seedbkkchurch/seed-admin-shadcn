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
import { CalendarDays, CalendarRange, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLambDevotionActivity } from "../data/queries";

type DevotionStatTilesProps = {
  lambId: string;
};

// กล่องตัวเลขสรุป อาทิตย์นี้ / เดือนนี้ / ปีนี้ บนหน้า "ประวัติเฝ้าเดี่ยวทั้งหมด"
// (lamb-devotion-table-page.tsx, 2026-11-08) — นับแบบเดียวกับการ์ด
// DevotionSection เพื่อให้ตัวเลขตรงกัน:
// - อ่านจาก view lamb_devotion_activity (รวมรายการส่วนตัว)
// - นับเฉพาะ content_type = "devotion" (ไม่นับคำเทศนา)
// - นับเป็น "จำนวนวันที่มีเฝ้าเดี่ยว" (ส่งหลายอันในวันเดียวนับ 1)
// - ช่วงเวลาเป็นปฏิทิน: อาทิตย์ จ–อา (weekStartsOn: 1 — เริ่มวันจันทร์ตามที่ขอ
//   2026-11-08 ต่างจากหน้าเช็คชื่อที่เริ่มวันอาทิตย์),
//   เดือนปฏิทิน, ปีปฏิทิน (ไม่ใช่ rolling 1 ปีแบบในการ์ด)
export function DevotionStatTiles({ lambId }: DevotionStatTilesProps) {
  const [today] = useState(() => new Date());
  const { data: activity, isPending } = useLambDevotionActivity(lambId);

  const counts = useMemo(() => {
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
      week: countBetween(
        startOfWeek(today, { weekStartsOn: 1 }),
        endOfWeek(today, { weekStartsOn: 1 }),
      ),
      month: countBetween(startOfMonth(today), endOfMonth(today)),
      year: countBetween(startOfYear(today), endOfYear(today)),
    };
  }, [activity, today]);

  const tiles = [
    { label: "อาทิตย์นี้", value: counts.week, icon: CalendarCheck },
    { label: "เดือนนี้", value: counts.month, icon: CalendarDays },
    { label: "ปีนี้", value: counts.year, icon: CalendarRange },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {tiles.map(({ label, value, icon: Icon }) => (
        <Card key={label} className="gap-2 py-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 sm:px-6">
            <CardTitle className="text-sm font-medium">
              เฝ้าเดี่ยว{label}
            </CardTitle>
            <Icon className="text-muted-foreground hidden size-4 sm:block" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {isPending ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {value}
                <span className="text-muted-foreground ms-1 text-sm font-normal">
                  ครั้ง
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
