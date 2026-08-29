import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { AlertCircle, CalendarIcon, PenLine, X } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DEVOTION_CONTENT_TYPE_LABELS } from "./data/devotion-schema";
import { useLambDevotionFeed } from "./data/queries";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// วันสุดท้ายที่กด "วันนี้" เลือกได้ — ปิดวันในอนาคตใน calendar เพราะไม่มีทาง
// มีเฝ้าเดี่ยวล่วงหน้า (grill-me 2026-08-29)
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

// 4 ระดับความเข้ม (เขียวอ่อน -> เขียวเข้ม) ตามจำนวนคนส่งเฝ้าเดี่ยวในวันนั้น
// เทียบกับวันที่มีคนส่งเยอะสุดที่โหลดมา (relative เหมือน GitHub contribution
// graph ไม่ใช่เกณฑ์ตายตัว เพราะจำนวนสมาชิกที่ active เปลี่ยนไปเรื่อยๆ) —
// เพิ่มตามคำขอ grill-me 2026-08-29 ("จุดเขียวอ่อน/เข้มตามจำนวนคน")
const INTENSITY_DOT_CLASSNAMES = [
  "", // level 0 มี handle แยกอยู่แล้ว (ไม่ผ่านมาถึงตรงนี้)
  "after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-green-300 after:content-[''] dark:after:bg-green-800",
  "after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-green-500 after:content-[''] dark:after:bg-green-600",
  "after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-green-700 after:content-[''] dark:after:bg-green-400",
  "after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-green-900 after:content-[''] dark:after:bg-green-200",
] as const;

function intensityLevel(count: number, maxCount: number): 1 | 2 | 3 | 4 {
  if (maxCount <= 1) return count > 0 ? 4 : 1;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

// Cross-lamb เฝ้าเดี่ยว feed — landing page for the "เฝ้าเดี่ยว" sidebar
// item. Reads the real `lamb_devotion` table (see data/queries.ts /
// docs/devotion-db-design.md).
//
// Date filter (grill-me 2026-08-29): เลือกวันเดียวเพื่อกรอง feed ให้เหลือ
// เฉพาะของวันนั้น — กรองฝั่ง client จาก entries ที่ useLambDevotionFeed()
// โหลดมาทั้งหมดอยู่แล้ว (ไม่มี pagination) ไม่ query DB ใหม่ทุกครั้งที่
// เปลี่ยนวัน default ยังเป็น "แสดงทั้งหมด" เหมือนเดิม ไม่ default เป็นวันนี้
// (กันไม่ให้ดูเหมือนแอปพังตอนยังไม่มีใครส่งของวันนี้) calendar ไฮไลต์วันที่
// มีคนส่งแล้วด้วยจุดสีเขียว ความเข้มขึ้นกับจำนวนคนส่งวันนั้นเทียบกับวันที่
// เยอะสุด (relative intensity) เพราะข้อมูลอยู่ใน client ครบอยู่แล้ว แทบไม่มี
// ต้นทุนเพิ่ม
export function DevotionFeed() {
  const { data: entries, isPending, isError, error } = useLambDevotionFeed();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const countsByDate = useMemo(() => {
    const counts = new Map<string, number>();
    entries?.forEach((entry) => {
      counts.set(entry.devotion_date, (counts.get(entry.devotion_date) ?? 0) + 1);
    });
    return counts;
  }, [entries]);

  const maxCount = useMemo(
    () => Math.max(0, ...Array.from(countsByDate.values())),
    [countsByDate],
  );

  // สร้าง matcher แยกทีละ level ตรงๆ (ไม่ใช้ Object.keys().forEach — เจอบั๊ก
  // จริงตอนทดสอบ: Object.keys() คืน key เป็น string เสมอ ("1" ไม่ใช่ 1)
  // เทียบกับ intensityLevel() ที่คืนเป็น number ด้วย === เลยไม่ตรงกันสักที
  // เดียว ทำให้จุดไม่ขึ้นเลยสักวัน — grill-me follow-up 2026-08-29)
  const dotLevelModifiers = useMemo(() => {
    const levelOf = (date: Date): 1 | 2 | 3 | 4 | null => {
      const count = countsByDate.get(format(date, "yyyy-MM-dd"));
      if (!count) return null;
      return intensityLevel(count, maxCount);
    };
    return {
      1: (date: Date) => levelOf(date) === 1,
      2: (date: Date) => levelOf(date) === 2,
      3: (date: Date) => levelOf(date) === 3,
      4: (date: Date) => levelOf(date) === 4,
    };
  }, [countsByDate, maxCount]);

  const selectedDateKey = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null;

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (!selectedDateKey) return entries;
    return entries.filter((entry) => entry.devotion_date === selectedDateKey);
  }, [entries, selectedDateKey]);

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">เฝ้าเดี่ยว</h2>
            <p className="text-muted-foreground">
              ประวัติเฝ้าเดี่ยวของสมาชิกทุกคน
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(!selectedDate && "text-muted-foreground")}
                >
                  <CalendarIcon />
                  {selectedDate
                    ? format(selectedDate, "d MMM yyyy")
                    : "เลือกวันที่"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={{ after: endOfToday() }}
                  modifiers={dotLevelModifiers}
                  modifiersClassNames={{
                    1: INTENSITY_DOT_CLASSNAMES[1],
                    2: INTENSITY_DOT_CLASSNAMES[2],
                    3: INTENSITY_DOT_CLASSNAMES[3],
                    4: INTENSITY_DOT_CLASSNAMES[4],
                  }}
                />
                {maxCount > 0 && (
                  <div className="flex items-center justify-end gap-1 border-t px-3 py-2 text-[10px] text-muted-foreground">
                    <span>น้อย</span>
                    <span className="size-2 rounded-full bg-green-300 dark:bg-green-800" />
                    <span className="size-2 rounded-full bg-green-500 dark:bg-green-600" />
                    <span className="size-2 rounded-full bg-green-700 dark:bg-green-400" />
                    <span className="size-2 rounded-full bg-green-900 dark:bg-green-200" />
                    <span>มาก</span>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="ล้างตัวกรองวันที่"
                onClick={() => setSelectedDate(undefined)}
              >
                <X />
              </Button>
            )}
            <Button asChild size="lg">
              <Link to="/lamb-info/devotion/new">
                <PenLine /> เขียนเฝ้าเดี่ยว
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-3xl gap-4">
          {isError ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>โหลดเฝ้าเดี่ยวไม่สำเร็จ</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Something went wrong."}
              </AlertDescription>
            </Alert>
          ) : isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              {selectedDate
                ? `ยังไม่มีใครส่งเฝ้าเดี่ยวในวันที่ ${format(selectedDate, "d MMM yyyy")}`
                : "ยังไม่มีใครส่งเฝ้าเดี่ยว — เป็นคนแรกได้เลย"}
            </p>
          ) : (
            filteredEntries.map((entry) => {
              // Card shows nickname only (falls back to first name) — no
              // last name here. Per grill-me follow-up (2026-08-14).
              const lambName = entry.lamb_info
                ? (entry.lamb_info.nick_name ?? entry.lamb_info.first_name)
                : "ไม่ทราบชื่อ";
              const avatarUrl = entry.lamb_info?.profile_picture ?? null;
              const coverImage = entry.image_urls[0] ?? null;

              return (
                <Link
                  key={entry.id}
                  to="/lamb-info/devotion/$devotionId"
                  params={{ devotionId: entry.id }}
                  className="block"
                >
                  <Card className="overflow-hidden py-0 transition-colors hover:bg-muted/50 sm:py-6">
                    {coverImage && (
                      <img
                        src={coverImage}
                        alt={entry.title}
                        className="aspect-video w-full object-cover sm:hidden"
                      />
                    )}
                    <CardContent className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:py-0">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Avatar className="size-6">
                            {avatarUrl && (
                              <AvatarImage src={avatarUrl} alt="" />
                            )}
                            <AvatarFallback className="text-[10px]">
                              {getInitials(lambName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {lambName}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {format(
                              parseISO(entry.devotion_date),
                              "d MMM yyyy",
                            )}
                          </span>
                          {/* badge ประเภท — เพิ่มโดย grill-me 2026-08-26 */}
                          <Badge variant="secondary">
                            {DEVOTION_CONTENT_TYPE_LABELS[entry.content_type]}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold">{entry.title}</h3>
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {stripHtml(entry.content_html)}
                        </p>
                      </div>
                      {coverImage && (
                        <img
                          src={coverImage}
                          alt={entry.title}
                          className="hidden h-24 w-32 shrink-0 rounded-md object-cover sm:block"
                        />
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </Main>
    </>
  );
}
