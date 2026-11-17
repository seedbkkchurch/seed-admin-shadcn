import { Link } from "@tanstack/react-router";
import { AlertCircle, BookOpen } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookProgressRow } from "@/features/bible/components/book-progress-row";
import {
  ReadingProgressRing,
  TestamentLegend,
} from "@/features/bible/components/reading-progress-ring";
import { useMyReadingProgress } from "@/features/bible/hooks/use-my-reading-progress";

// อ่านค้างหลายเล่มก็โชว์แค่ที่อ่านล่าสุด — ที่เหลือดูในหน้าเต็ม
const MAX_IN_PROGRESS = 3;

// การ์ดสรุปความคืบหน้าการอ่านพระคัมภีร์ในหน้า /spiritual (grill-me
// 2026-11-16): วงกลมรวม + สัดส่วนเดิม/ใหม่ + พระธรรมที่อ่านค้างพร้อมปุ่มอ่าน
// ต่อ "ดูทั้งหมด" ไปหน้าเต็ม /bible/progress (แถบครบ 66 เล่ม)
export function BibleProgressCard() {
  const { progress, isLoading, error } = useMyReadingProgress();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-lg font-semibold">ความคืบหน้าการอ่านพระคัมภีร์</h3>
        <Button variant="outline" size="sm" asChild>
          <Link to="/bible/progress">ดูทั้งหมด</Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : isLoading || !progress ? (
        <Skeleton className="h-56 w-full" />
      ) : (
        <Card>
          <CardContent className="grid gap-6 lg:grid-cols-2 lg:gap-10">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <ReadingProgressRing progress={progress} />
              <div className="w-full flex-1">
                <TestamentLegend progress={progress} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">พระธรรมที่อ่านค้างไว้</p>
              {progress.inProgress.length === 0 ? (
                <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-4">
                  <p className="text-muted-foreground text-sm">
                    {progress.all.read === 0
                      ? "ยังไม่ได้เริ่มอ่าน เลื่อนอ่านให้ถึงท้ายบท ระบบจะนับให้เอง"
                      : "ไม่มีเล่มที่อ่านค้าง เลือกพระธรรมเล่มใหม่อ่านต่อได้เลย"}
                  </p>
                  <Button size="sm" asChild>
                    <Link
                      to="/bible/$book/$chapter"
                      params={{ book: "1", chapter: "1" }}
                    >
                      <BookOpen />
                      เปิดพระคัมภีร์
                    </Link>
                  </Button>
                </div>
              ) : (
                progress.inProgress
                  .slice(0, MAX_IN_PROGRESS)
                  .map((item) => (
                    <BookProgressRow key={item.book.number} item={item} />
                  ))
              )}
              {progress.inProgress.length > MAX_IN_PROGRESS && (
                <p className="text-muted-foreground text-xs">
                  และอีก {progress.inProgress.length - MAX_IN_PROGRESS}{" "}
                  เล่มที่อ่านค้าง
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
