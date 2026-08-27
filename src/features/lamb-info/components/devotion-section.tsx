import { useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
  subDays,
} from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLambDevotionHistory } from "../data/queries";
import { DevotionHeatmap, type DevotionHeatmapEntry } from "./devotion-heatmap";
import { DevotionMonthlyChart } from "./devotion-monthly-chart";
import { DevotionRecentList } from "./devotion-recent-list";

type DevotionView = "day" | "month" | "year";

// Fixed rolling windows from today (no navigation) — matches the no-nav
// design already established for the daily heatmap (see
// devotion-heatmap.tsx doc comment / grill-me follow-up 2026-08-09).
const ONE_YEAR_DAYS_BACK = 364;
const THREE_YEAR_DAYS_BACK = 3 * 365 - 1;

type DevotionSectionProps = {
  lambId: string;
};

// เฝ้าเดี่ยว (personal daily devotion) history for a single lamb — reads
// the real `lamb_devotion` table (both public and private rows; this is
// the admin's own view of the lamb's full history, so status doesn't
// change how a day reads here) with three switchable views: รายวัน
// (GitHub-style daily dots, ~1yr), รายเดือน (bar chart, rolling 12
// months), รายปี (GitHub-style daily dots, ~3yr). Per grill-me follow-up
// (2026-08-11) — replaces the earlier mock-data-only version
// (data/devotions.ts).
export function DevotionSection({ lambId }: DevotionSectionProps) {
  // Stable for the component's lifetime so "today" doesn't shift the
  // rolling windows mid-session.
  const [today] = useState(() => new Date());
  const [view, setView] = useState<DevotionView>("day");

  const { data: entries, isPending } = useLambDevotionHistory(lambId);

  // เฉพาะ content_type = devotion — heatmap/สถิติ (จุดสี, oneYear/threeYear/
  // thisWeekCount ด้านล่าง, กราฟรายเดือน) นับเฉพาะการส่งเฝ้าเดี่ยวจริง ไม่
  // นับคำเทศนา (ตกลงใน grill-me 2026-08-26) — "ประวัติล่าสุด" ด้านล่างยัง
  // แสดงทั้งสองประเภทปนกัน (ดู recentEntries) เพราะเป็นแค่รายการดูย้อนหลัง
  // ไม่ใช่ตัวชี้วัดการเฝ้าเดี่ยว
  const devotionOnlyEntries = useMemo(
    () => (entries ?? []).filter((e) => e.content_type === "devotion"),
    [entries],
  );

  // ค่า array เพราะ 1 วันมีได้มากกว่า 1 เฝ้าเดี่ยว (คอนสตรเทนต์ 1 ครั้ง/วัน
  // เอาออกแล้ว — ดู grill-me 2026-08-14, `devotion_multi_submit_design`)
  const entriesByDate = useMemo(() => {
    const map = new Map<string, DevotionHeatmapEntry[]>();
    for (const entry of devotionOnlyEntries) {
      const list = map.get(entry.devotion_date) ?? [];
      list.push({
        id: entry.id,
        title: entry.title,
        image_urls: entry.image_urls,
      });
      map.set(entry.devotion_date, list);
    }
    return map;
  }, [devotionOnlyEntries]);

  const getEntries = (date: Date) =>
    entriesByDate.get(format(date, "yyyy-MM-dd")) ?? [];

  // useLambDevotionHistory returns oldest-first (see queries.ts) — reverse
  // for the "ประวัติล่าสุด" list below the graph, which wants newest-first.
  const recentEntries = useMemo(
    () => (entries ?? []).slice().reverse(),
    [entries],
  );

  const oneYearCount = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(today, ONE_YEAR_DAYS_BACK),
      end: today,
    });
    return days.filter((d) => entriesByDate.has(format(d, "yyyy-MM-dd")))
      .length;
  }, [today, entriesByDate]);

  const threeYearCount = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(today, THREE_YEAR_DAYS_BACK),
      end: today,
    });
    return days.filter((d) => entriesByDate.has(format(d, "yyyy-MM-dd")))
      .length;
  }, [today, entriesByDate]);

  // อาทิตย์นี้ = สัปดาห์ปฏิทิน อา-ส (weekStartsOn: 0) ที่ครอบ "today" — เดียวกับ
  // week_start ที่หน้าเช็คชื่อรายสัปดาห์ (attendance) ใช้ ดู grill-me 2026-08-13
  const thisWeekCount = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfWeek(today, { weekStartsOn: 0 }),
      end: endOfWeek(today, { weekStartsOn: 0 }),
    });
    return days.filter((d) => entriesByDate.has(format(d, "yyyy-MM-dd")))
      .length;
  }, [today, entriesByDate]);

  const statText =
    view === "year"
      ? `ส่งเฝ้าเดี่ยว ${threeYearCount} ครั้งในรอบ 3 ปีที่ผ่านมา • อาทิตย์นี้ ${thisWeekCount} ครั้ง`
      : `ส่งเฝ้าเดี่ยว ${oneYearCount} ครั้งในรอบ 1 ปีที่ผ่านมา • อาทิตย์นี้ ${thisWeekCount} ครั้ง`;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-semibold">ประวัติเฝ้าเดี่ยว</div>
          <p className="text-sm text-muted-foreground">{statText}</p>
        </div>
        {/* ปุ่ม "ส่งเฝ้าเดี่ยว" (เปิด DevotionUploadDialog) เอาออกแล้ว — เดิม
        ส่งเข้าชื่อ "เจ้าของโปรไฟล์ที่กำลังดูอยู่" ไม่ใช่ตัวเอง ทำให้ใครก็ตาม
        ที่เข้าดูโปรไฟล์ลูกแกะคนอื่นส่งเฝ้าเดี่ยวแทนคนนั้นได้ — การส่งเฝ้าเดี่ยว
        จริงมีหน้า "เขียนเฝ้าเดี่ยว" แยกต่างหากอยู่แล้ว (auto-detect เป็นของ
        ตัวเองเสมอ ดู devotion-editor.tsx) การ์ดนี้จึงเหลือไว้แค่ประวัติ/กราฟ
        ให้ดูอย่างเดียว (ดู grill-me 2026-08-23) */}
        <Tabs value={view} onValueChange={(v) => setView(v as DevotionView)}>
          <TabsList>
            <TabsTrigger value="day">รายวัน</TabsTrigger>
            <TabsTrigger value="month">รายเดือน</TabsTrigger>
            <TabsTrigger value="year">รายปี</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            {view === "day" ? (
              <DevotionHeatmap
                today={today}
                daysBack={ONE_YEAR_DAYS_BACK}
                getEntries={getEntries}
              />
            ) : view === "month" ? (
              <DevotionMonthlyChart today={today} entries={devotionOnlyEntries} />
            ) : (
              <DevotionHeatmap
                today={today}
                daysBack={THREE_YEAR_DAYS_BACK}
                getEntries={getEntries}
              />
            )}

            <DevotionRecentList lambId={lambId} entries={recentEntries} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
