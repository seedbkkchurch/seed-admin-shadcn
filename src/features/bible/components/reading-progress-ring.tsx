import { cn } from "@/lib/utils";
import {
  type ReadingProgress,
  type ReadTotals,
  formatPercent,
} from "../lib/reading-progress";

const RADIUS = 52;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// วงกลมเปอร์เซ็นต์การอ่านทั้งเล่ม (grill-me 2026-11-16) — วงเดียว 2 ส่วนสี:
// บทที่อ่านแล้วของพันธสัญญาเดิม (อำพัน) ต่อด้วยพันธสัญญาใหม่ (ฟ้า) เทียบกับ
// ทั้ง 1,189 บท ตัวเลขกลางวงคือเปอร์เซ็นต์รวม
export function ReadingProgressRing({
  progress,
  className,
}: {
  progress: ReadingProgress;
  className?: string;
}) {
  const { all, oldTestament, newTestament } = progress;
  const total = all.total || 1;
  const oldLength = (oldTestament.read / total) * CIRCUMFERENCE;
  const newLength = (newTestament.read / total) * CIRCUMFERENCE;

  return (
    <div className={cn("relative size-40 shrink-0", className)}>
      <svg
        viewBox="0 0 128 128"
        className="size-full -rotate-90"
        role="img"
        aria-label={`อ่านพระคัมภีร์แล้ว ${formatPercent(all)}% (${all.read} จาก ${all.total} บท)`}
      >
        <circle
          cx="64"
          cy="64"
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted"
        />
        {oldLength > 0 && (
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeDasharray={`${oldLength} ${CIRCUMFERENCE}`}
            className="stroke-amber-500"
          />
        )}
        {newLength > 0 && (
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeDasharray={`${newLength} ${CIRCUMFERENCE}`}
            strokeDashoffset={-oldLength}
            className="stroke-sky-500"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">
          {formatPercent(all)}
          <span className="text-lg">%</span>
        </span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {all.read.toLocaleString()} / {all.total.toLocaleString()} บท
        </span>
      </div>
    </div>
  );
}

// คำอธิบายสี + สัดส่วนแยกพันธสัญญาเดิม/ใหม่ ใช้คู่กับวงกลมด้านบน
export function TestamentLegend({ progress }: { progress: ReadingProgress }) {
  return (
    <div className="space-y-3">
      <TestamentRow
        label="พันธสัญญาเดิม"
        dotClassName="bg-amber-500"
        barClassName="bg-amber-500"
        totals={progress.oldTestament}
      />
      <TestamentRow
        label="พันธสัญญาใหม่"
        dotClassName="bg-sky-500"
        barClassName="bg-sky-500"
        totals={progress.newTestament}
      />
    </div>
  );
}

function TestamentRow({
  label,
  dotClassName,
  barClassName,
  totals,
}: {
  label: string;
  dotClassName: string;
  barClassName: string;
  totals: ReadTotals;
}) {
  const percent = totals.total ? (totals.read / totals.total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <span className={cn("size-2.5 rounded-full", dotClassName)} />
          {label}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {totals.read.toLocaleString()}/{totals.total.toLocaleString()} บท ·{" "}
          {formatPercent(totals)}%
        </span>
      </div>
      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", barClassName)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
