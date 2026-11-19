import { useMemo } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { AlertCircle, Cake } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { BibleMusicButton } from "@/features/bible-music/components/bible-music-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardLambs } from "@/features/dashboard/data/queries";
import { computeBirthdaysInMonth } from "@/features/dashboard/lib/aggregate";
import { BirthdayFan } from "./components/birthday-fan";

const route = getRouteApi("/_authenticated/birthdays/");

// เดือนเกิด, 12 เดือน (index 0-11 ตรงกับ Date.getMonth()) — ค่าเดียวกับที่
// devotion-daily-table.tsx ใช้ (ไม่มี util กลางในโปรเจกต์นี้ ตั้งใจก็อปปี้
// ตรงๆ ตามสไตล์เดิมของโปรเจกต์ แทนที่จะสร้าง shared util ใหม่)
const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

// หน้า "เดือนเกิด" แยกออกมาจาก Dashboard เป็นเมนู sidebar เต็ม (grill-me
// 2026-08-30) — เหมือน BirthdayThisMonthCard บน Dashboard ทุกอย่าง
// (filter status=จริง + เรียงตามวันที่ ใช้ BirthdayList ตัวเดียวกัน) แค่
// เพิ่ม dropdown เลือกดูเดือนอื่นได้ (ไม่ได้ล็อกที่เดือนปัจจุบันเหมือน
// การ์ดเดิม) การ์ดบน Dashboard ยังคงอยู่เหมือนเดิม ไม่ได้ถูกลบ/ย้าย —
// หน้านี้เป็นทางเลือกเพิ่มสำหรับดูเดือนอื่น
//
// เดือนที่เลือกเก็บใน URL search param `month` (0-11) ผ่าน
// routes/_authenticated/birthdays/index.tsx — refresh/แชร์ลิงก์แล้วยังอยู่
// เดือนเดิม ไม่มี `month` ใน URL = ใช้เดือนปัจจุบัน
//
// อัปเดต 2026-11-16 (grill-me 2026-11-15): รายชื่อ BirthdayList เปลี่ยนเป็น
// พัดการ์ดวันเกิด (components/birthday-fan.tsx) แบบเดียวกับการ์ดเฝ้าเดี่ยว
// การ์ดบน Dashboard ก็เปลี่ยนเป็นพัดเดียวกันด้วย
export function Birthdays() {
  const { month } = route.useSearch();
  const navigate = route.useNavigate();
  const { data: lambs, isPending, isError, error } = useDashboardLambs();

  const today = useMemo(() => new Date(), []);
  const selectedMonth = month ?? today.getMonth();

  const birthdayLambs = useMemo(
    () => computeBirthdaysInMonth(lambs ?? [], selectedMonth),
    [lambs, selectedMonth],
  );

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <BibleMusicButton className="rounded-full" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">เดือนเกิด</h2>
          <p className="text-muted-foreground">
            สมาชิกที่เกิดในเดือนที่เลือก (เฉพาะสมาชิกที่ยังอยู่) —
            ชี้หรือแตะการ์ดเพื่อดูแต่ละคน
          </p>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Something went wrong."}
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cake className="h-4 w-4" />
                {isPending
                  ? "กำลังโหลด..."
                  : `เกิดเดือน${THAI_MONTHS[selectedMonth]} — ${birthdayLambs.length} คน`}
              </CardTitle>

              <Select
                value={String(selectedMonth)}
                onValueChange={(v) =>
                  navigate({
                    search: (prev) => ({ ...prev, month: Number(v) }),
                  })
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THAI_MONTHS.map((name, index) => (
                    <SelectItem key={name} value={String(index)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="mx-auto aspect-[4/5] w-[400px] max-w-[85%] rounded-[28px]" />
              ) : (
                <BirthdayFan
                  lambs={birthdayLambs}
                  month={selectedMonth}
                  today={today}
                />
              )}
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  );
}
