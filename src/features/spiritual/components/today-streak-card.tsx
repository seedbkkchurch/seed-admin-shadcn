import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CircleCheckBig, Flame, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDevotionPeriodCounts } from "@/features/lamb-info/hooks/use-devotion-period-counts";
import { computeDevotionStreak } from "../lib/streak";

// "วันนี้เฝ้าเดี่ยวหรือยัง" + วันต่อเนื่อง — นับเฉพาะประเภทเฝ้าเดี่ยว (ไม่รวม
// คำเทศนา/ขอบคุณพระเจ้า) จากชุดข้อมูลเดียวกับกล่องสถิติ อาทิตย์/เดือน/ปี
export function TodayStreakCard({ lambId }: { lambId: string }) {
  const { devotionDays, today, isPending } = useDevotionPeriodCounts(lambId);
  const doneToday = devotionDays.has(format(today, "yyyy-MM-dd"));
  const streak = useMemo(
    () => computeDevotionStreak(devotionDays, today),
    [devotionDays, today],
  );

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between gap-6">
        {isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">วันนี้</p>
              {doneToday ? (
                <p className="flex items-center gap-2 text-xl font-semibold">
                  <CircleCheckBig className="size-5 text-green-600 dark:text-green-400" />
                  เฝ้าเดี่ยวแล้ว
                </p>
              ) : (
                <p className="text-xl font-semibold">ยังไม่ได้เฝ้าเดี่ยว</p>
              )}
            </div>

            <div className="flex items-end gap-6">
              <div>
                <p className="flex items-center gap-1.5 text-4xl font-bold tabular-nums">
                  <Flame
                    className={
                      streak.current > 0
                        ? "size-7 text-orange-500"
                        : "text-muted-foreground size-7"
                    }
                  />
                  {streak.current}
                </p>
                <p className="text-muted-foreground text-sm">วันต่อเนื่อง</p>
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums">
                  {streak.best}
                </p>
                <p className="text-muted-foreground text-sm">สถิติสูงสุด</p>
              </div>
            </div>

            <Button asChild variant={doneToday ? "outline" : "default"}>
              <Link to="/lamb-info/devotion/new">
                <PenLine /> {doneToday ? "เขียนเพิ่ม" : "เขียนเฝ้าเดี่ยววันนี้"}
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
