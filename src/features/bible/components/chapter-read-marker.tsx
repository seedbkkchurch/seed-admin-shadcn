import { useEffect, useRef, useState } from "react";
import { Check, CircleCheckBig } from "lucide-react";
import { toast } from "sonner";
import { useMyLamb } from "@/hooks/use-my-lamb";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  bangkokToday,
  useBibleReadingSummary,
  useMarkChapterRead,
  useUnmarkChapterReadToday,
} from "../data/reading-progress";

// หลังเปลี่ยนบท ยังไม่นับว่า "เลื่อนถึงท้ายบท" ในช่วงสั้นๆ นี้ — กดปุ่มบทถัดไป
// ที่อยู่ล่างสุดแล้วหน้ากำลังเลื่อนกลับขึ้นบน ท้ายบทใหม่จะโผล่ในจอแวบหนึ่ง
const GRACE_MS = 1500;
const MIN_DWELL_S = 10;
const MAX_DWELL_S = 60;
// ไม่รู้จำนวนข้อ (หน้า Live ได้เนื้อความมาเป็นก้อนเดียว)
const DEFAULT_DWELL_S = 20;

type ChapterReadMarkerProps = {
  bookNumber: number;
  chapter: number;
  /** จำนวนข้อของบท — ใช้กำหนดเวลาขั้นต่ำก่อนนับ (ราว 1 วินาทีต่อข้อ) */
  verseCount?: number;
  /** หยุดนับอัตโนมัติชั่วคราว (เช่น มีโหมดอ่านเต็มจอเปิดทับอยู่) */
  disabled?: boolean;
  className?: string;
};

// ตัวนับการอ่านท้ายบท (grill-me 2026-11-16) — วางไว้ใต้ข้อสุดท้ายของทุกจุดที่
// อ่านพระคัมภีร์ได้ (BiblePanel ปกติ/ฝังในหน้าเขียนเฝ้าเดี่ยว, โหมดอ่านเต็มจอ,
// หน้า Live):
// - เลื่อนจนแถบนี้โผล่ในจอ = ถึงท้ายบท และอยู่ในบทนานพอ (ราว 1 วินาทีต่อข้อ
//   10-60 วินาที) → นับว่าอ่านบทนี้ของวันนี้ให้อัตโนมัติ บทละไม่เกิน 1 ครั้ง
//   ต่อวัน (unique ที่ฐานข้อมูล)
// - มีปุ่มให้นับเอง/ยกเลิกการนับของวันนี้ เผื่อระบบนับผิด ยกเลิกแล้วจะไม่นับ
//   อัตโนมัติซ้ำจนกว่าจะเปิดบทอื่น
// - บัญชีที่ไม่ได้ผูกกับข้อมูลสมาชิก: ไม่แสดงและไม่นับ
export function ChapterReadMarker({
  bookNumber,
  chapter,
  verseCount,
  disabled = false,
  className,
}: ChapterReadMarkerProps) {
  const myLamb = useMyLamb();
  const lambId = myLamb.data?.id;
  const summary = useBibleReadingSummary(lambId);
  const { mutate: markRead, isPending: isMarking } = useMarkChapterRead();
  const { mutate: unmarkRead, isPending: isUnmarking } =
    useUnmarkChapterReadToday();

  const sentinelRef = useRef<HTMLDivElement>(null);
  const chapterKey = `${bookNumber}:${chapter}`;
  // บทที่ผู้ใช้กดยกเลิกการนับเอง — ไม่นับอัตโนมัติซ้ำระหว่างที่ยังอยู่ในบทนั้น
  const [suppressedKey, setSuppressedKey] = useState<string | null>(null);

  const entry = summary.data?.find(
    (row) => row.book === bookNumber && row.chapter === chapter,
  );
  const timesRead = entry?.timesRead ?? 0;
  const readToday = entry?.lastReadDate === bangkokToday();
  const summaryReady = summary.isSuccess;
  const suppressed = suppressedKey === chapterKey;

  useEffect(() => {
    if (disabled || !lambId || !summaryReady || readToday || suppressed) {
      return;
    }
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const startedAt = Date.now();
    const dwellMs =
      Math.min(
        MAX_DWELL_S,
        Math.max(MIN_DWELL_S, verseCount ?? DEFAULT_DWELL_S),
      ) * 1000;
    let visible = false;
    let reachedEnd = false;

    const observer = new IntersectionObserver(([observed]) => {
      visible = observed.isIntersecting;
    });
    observer.observe(sentinel);

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const elapsed = Date.now() - startedAt;
      if (visible && elapsed >= GRACE_MS) reachedEnd = true;
      if (!reachedEnd || elapsed < dwellMs) return;

      window.clearInterval(timer);
      markRead({ lambId, book: bookNumber, chapter });
    }, 1000);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [
    disabled,
    lambId,
    summaryReady,
    readToday,
    suppressed,
    bookNumber,
    chapter,
    verseCount,
    markRead,
  ]);

  if (!lambId) return null;

  const handleMark = () => {
    setSuppressedKey(null);
    markRead(
      { lambId, book: bookNumber, chapter },
      { onError: () => toast.error("บันทึกการอ่านไม่สำเร็จ ลองอีกครั้ง") },
    );
  };

  const handleUnmark = () => {
    setSuppressedKey(chapterKey);
    unmarkRead(
      { lambId, book: bookNumber, chapter },
      { onError: () => toast.error("ยกเลิกไม่สำเร็จ ลองอีกครั้ง") },
    );
  };

  return (
    <div
      ref={sentinelRef}
      className={cn(
        "text-muted-foreground flex min-h-9 flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm",
        className,
      )}
    >
      {readToday ? (
        <>
          <span className="flex items-center gap-1.5">
            <CircleCheckBig className="size-4 text-green-600 dark:text-green-400" />
            นับการอ่านบทนี้ของวันนี้แล้ว
            {timesRead > 1 ? ` · อ่านมาแล้ว ${timesRead} ครั้ง` : ""}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isUnmarking}
            onClick={handleUnmark}
          >
            ยกเลิก
          </Button>
        </>
      ) : (
        <>
          {timesRead > 0 && <span>เคยอ่านบทนี้ {timesRead} ครั้ง</span>}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isMarking || !summaryReady}
            onClick={handleMark}
          >
            <Check />
            นับว่าอ่านบทนี้แล้ว
          </Button>
        </>
      )}
    </div>
  );
}
