import { createContext, useContext, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  min as minDate,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { th } from "date-fns/locale";
import { ArrowRight, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import type { DayButton } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { DevotionHeatmapEntry } from "@/features/lamb-info/components/devotion-heatmap";
import {
  useLambDevotionActivity,
  useLambDevotionHistory,
} from "@/features/lamb-info/data/queries";

// ปฏิทินเฝ้าเดี่ยวรายเดือน (grill-me 2026-11-18) — การ์ดใต้ TodayStreakCard
// ในหน้า /spiritual
// - เกณฑ์เดียวกับ heatmap: เฉพาะ content_type = devotion, รวมรายการส่วนตัว
//   (view lamb_devotion_activity), อิง devotion_date
// - วันที่มีเฝ้าเดี่ยว = จุดเขียวใต้ตัวเลข (หลายครั้งก็จุดเดียว) กดแล้วขึ้น
//   Popover รายการ + ลิงก์ไปหน้ารายละเอียด วันที่ว่างกดไม่ได้ (ไม่มีปุ่มเขียน
//   ย้อนหลัง)
// - เดือนไทย + พ.ศ., สัปดาห์เริ่มวันจันทร์ (ตรงกับตัวนับ "อาทิตย์นี้")
// - เลื่อนได้ตั้งแต่เดือนของเฝ้าเดี่ยวรายการแรกถึงเดือนปัจจุบัน
// - สรุปจำนวนวันที่เฝ้าในเดือนที่กำลังดู (เดือนปัจจุบันนับถึงวันนี้)
// - ย่อแบบ minimal (grill-me 2026-11-18 รอบ 2): ช่อง ~28px, ไม่มีหัวการ์ด,
//   ‹ เดือน › + สรุป "x/y วัน" อยู่แถวเดียวด้านบน (ซ่อน caption/nav ของ
//   react-day-picker แล้ววาดเอง)

const WEEKDAY_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const thaiMonthYear = (date: Date) =>
  `${format(date, "MMMM", { locale: th })} ${date.getFullYear() + 543}`;

const EntriesContext = createContext<(date: Date) => DevotionHeatmapEntry[]>(
  () => [],
);

function DevotionDayButton(props: React.ComponentProps<typeof DayButton>) {
  const getEntries = useContext(EntriesContext);
  const { day, modifiers, className } = props;
  const entries = modifiers.outside ? [] : getEntries(day.date);
  const hasEntries = entries.length > 0;

  const button = (
    <CalendarDayButton
      {...props}
      tabIndex={hasEntries ? props.tabIndex : -1}
      className={cn(
        className,
        !hasEntries && "pointer-events-none",
        "gap-0.5 text-xs",
        modifiers.today && "ring-1 ring-green-700 dark:ring-green-300",
      )}
    >
      {props.children}
      <span
        aria-hidden
        className={cn(
          "size-1 rounded-full opacity-100!",
          hasEntries ? "bg-green-500 dark:bg-green-500" : "bg-transparent",
        )}
      />
    </CalendarDayButton>
  );

  if (!hasEntries) return button;

  return (
    <Popover>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-sm font-medium">
            {format(day.date, "d MMMM", { locale: th })}{" "}
            {day.date.getFullYear() + 543}
          </div>
          {entries.length > 1 && (
            <span className="text-xs text-muted-foreground">
              {entries.length} รายการ
            </span>
          )}
        </div>
        <div className="max-h-72 space-y-3 overflow-y-auto">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="border-b pb-3 last:border-b-0 last:pb-0"
            >
              {entry.locked ? (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Lock className="size-3.5" />
                  เฝ้าเดี่ยวส่วนตัว
                </p>
              ) : (
                <>
                  <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                    {entry.title}
                  </p>
                  {entry.image_urls[0] && (
                    <img
                      src={entry.image_urls[0]}
                      alt={entry.title}
                      className="mb-2 max-h-40 w-full rounded-md border object-cover"
                    />
                  )}
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                  >
                    <Link
                      to="/lamb-info/devotion/$devotionId"
                      params={{ devotionId: entry.id }}
                    >
                      อ่านเต็ม <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DevotionCalendarCard({
  lambId,
  today,
}: {
  lambId: string;
  today: Date;
}) {
  const [month, setMonth] = useState(() => startOfMonth(today));

  const { data: history, isPending: isHistoryPending } =
    useLambDevotionHistory(lambId);
  const { data: activity, isPending: isActivityPending } =
    useLambDevotionActivity(lambId);
  const isPending = isHistoryPending || isActivityPending;

  const entriesByDate = useMemo(() => {
    const visibleById = new Map((history ?? []).map((e) => [e.id, e]));
    const map = new Map<string, DevotionHeatmapEntry[]>();
    for (const entry of activity ?? []) {
      if (entry.content_type !== "devotion") continue;
      const visible = visibleById.get(entry.id);
      const list = map.get(entry.devotion_date) ?? [];
      list.push(
        visible
          ? {
              id: visible.id,
              title: visible.title,
              image_urls: visible.image_urls,
            }
          : { id: entry.id, title: "", image_urls: [], locked: true },
      );
      map.set(entry.devotion_date, list);
    }
    return map;
  }, [activity, history]);

  const getEntries = useMemo(
    () => (date: Date) => entriesByDate.get(format(date, "yyyy-MM-dd")) ?? [],
    [entriesByDate],
  );

  // เดือนแรกที่ย้อนไปได้ = เดือนของเฝ้าเดี่ยวรายการแรก (ไม่มีเลย = เดือนนี้)
  const startMonth = useMemo(() => {
    const dates = [...entriesByDate.keys()].map((d) => parseISO(d));
    return startOfMonth(dates.length ? minDate([...dates, today]) : today);
  }, [entriesByDate, today]);

  const monthSummary = useMemo(() => {
    const isCurrent = isSameMonth(month, today);
    const days = eachDayOfInterval({
      start: startOfMonth(month),
      end: isCurrent ? today : endOfMonth(month),
    });
    const done = days.filter((d) =>
      entriesByDate.has(format(d, "yyyy-MM-dd")),
    ).length;
    return { done, total: days.length };
  }, [month, today, entriesByDate]);

  const canPrev = month > startMonth;
  const canNext = !isSameMonth(month, today);

  return (
    <Card className="gap-0 py-3">
      <CardContent className="space-y-2 px-3">
        {isPending ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={!canPrev}
                  onClick={() => setMonth((m) => subMonths(m, 1))}
                  aria-label="เดือนก่อน"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <span className="min-w-28 text-center text-sm font-medium">
                  {thaiMonthYear(month)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={!canNext}
                  onClick={() => setMonth((m) => addMonths(m, 1))}
                  aria-label="เดือนถัดไป"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                เฝ้า {monthSummary.done}/{monthSummary.total} วัน
              </span>
            </div>
            <EntriesContext.Provider value={getEntries}>
              <Calendar
                month={month}
                onMonthChange={setMonth}
                startMonth={startMonth}
                endMonth={today}
                today={today}
                locale={th}
                weekStartsOn={1}
                showOutsideDays={false}
                hideNavigation
                // ไม่มี mode = เลือกวันไม่ได้ แต่ต้องมี onDayClick ให้
                // react-day-picker render เป็นปุ่ม (ใช้เปิด Popover)
                onDayClick={() => {}}
                className="mx-auto p-0 [--cell-size:--spacing(7)]"
                classNames={{
                  month: "flex w-full flex-col gap-1",
                  month_caption: "hidden",
                  weekday:
                    "flex-1 text-[0.7rem] font-normal text-muted-foreground select-none",
                  week: "mt-0.5 flex w-full",
                  today: "rounded-md",
                }}
                formatters={{
                  formatWeekdayName: (date) => WEEKDAY_TH[date.getDay()],
                }}
                components={{ DayButton: DevotionDayButton }}
              />
            </EntriesContext.Provider>
          </>
        )}
      </CardContent>
    </Card>
  );
}
