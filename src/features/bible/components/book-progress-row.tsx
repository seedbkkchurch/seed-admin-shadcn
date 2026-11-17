import { Link } from "@tanstack/react-router";
import { ChevronDown, CircleCheckBig } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type BookProgress } from "../lib/reading-progress";

type BookProgressRowProps = {
  item: BookProgress;
  /** แสดงตารางเลขบทใต้แถบ — ไม่ส่ง onToggle = แถวแบบย่อ กดขยายไม่ได้ */
  expanded?: boolean;
  onToggle?: () => void;
};

// แถบความคืบหน้ารายพระธรรม (grill-me 2026-11-16) เช่น "ยอห์น 15/21":
// - เล่มที่อ่านค้าง (เริ่มแล้วยังไม่ครบ) ไฮไลต์ + ปุ่ม "อ่านต่อ" ไปบทแรกที่ยัง
//   ไม่เคยอ่าน
// - กดแถวเพื่อขยายดูตารางเลขบท: บทที่อ่านแล้วทึบสี มีตัวเลข ×N เมื่ออ่านเกิน
//   1 ครั้ง กดเลขบทเพื่อเปิดอ่านบทนั้น
export function BookProgressRow({
  item,
  expanded = false,
  onToggle,
}: BookProgressRowProps) {
  const { book, read, total, status, nextChapter } = item;
  const percent = total ? (read / total) * 100 : 0;

  const summary = (
    <>
      <span className="flex w-24 shrink-0 items-center gap-1.5 truncate text-sm font-medium sm:w-36">
        {status === "done" && (
          <CircleCheckBig className="size-4 shrink-0 text-green-600 dark:text-green-400" />
        )}
        <span className="truncate">{book.nameTh}</span>
      </span>
      <span className="bg-muted h-2 min-w-0 flex-1 overflow-hidden rounded-full">
        <span
          className={cn(
            "block h-full rounded-full",
            status === "done" ? "bg-green-500" : "bg-primary",
          )}
          style={{ width: `${percent}%` }}
        />
      </span>
      <span className="text-muted-foreground w-14 shrink-0 text-end text-sm tabular-nums">
        {read}/{total}
      </span>
    </>
  );

  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        status === "reading" && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-2">
        {onToggle ? (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-start"
            aria-expanded={expanded}
            onClick={onToggle}
          >
            {summary}
            <ChevronDown
              className={cn(
                "text-muted-foreground size-4 shrink-0 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {summary}
          </div>
        )}
        {status === "reading" && nextChapter !== null && (
          <Button size="sm" className="shrink-0" asChild>
            <Link
              to="/bible/$book/$chapter"
              params={{
                book: String(book.number),
                chapter: String(nextChapter),
              }}
            >
              อ่านต่อ
              <span className="hidden sm:inline">บทที่ {nextChapter}</span>
            </Link>
          </Button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
          {Array.from({ length: total }, (_, index) => {
            const chapter = index + 1;
            const times = item.timesByChapter.get(chapter) ?? 0;
            return (
              <Link
                key={chapter}
                to="/bible/$book/$chapter"
                params={{
                  book: String(book.number),
                  chapter: String(chapter),
                }}
                aria-label={
                  times > 0
                    ? `บทที่ ${chapter} อ่านแล้ว ${times} ครั้ง`
                    : `บทที่ ${chapter} ยังไม่ได้อ่าน`
                }
                className={cn(
                  "relative flex h-9 items-center justify-center rounded-md border text-sm tabular-nums transition-colors",
                  times > 0
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {chapter}
                {times > 1 && (
                  <span className="bg-background text-foreground absolute -end-1 -top-1.5 rounded-full border px-1 text-[10px] leading-4">
                    ×{times}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
