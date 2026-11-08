import { CalendarCheck, CalendarDays, CalendarRange } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDevotionPeriodCounts } from "../hooks/use-devotion-period-counts";

type DevotionStatTilesProps = {
  lambId: string;
};

// กล่องตัวเลขสรุป อาทิตย์นี้ / เดือนนี้ / ปีนี้ บนหน้า "ประวัติเฝ้าเดี่ยวทั้งหมด"
// (lamb-devotion-table-page.tsx, 2026-11-08) — วิธีนับดู
// hooks/use-devotion-period-counts.ts (ใช้ร่วมกับการ์ดแชร์สถิติ)
export function DevotionStatTiles({ lambId }: DevotionStatTilesProps) {
  const { week, month, year, isPending } = useDevotionPeriodCounts(lambId);

  const tiles = [
    { label: "อาทิตย์นี้", value: week, icon: CalendarCheck },
    { label: "เดือนนี้", value: month, icon: CalendarDays },
    { label: "ปีนี้", value: year, icon: CalendarRange },
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
