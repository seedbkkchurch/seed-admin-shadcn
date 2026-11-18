import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useMyLamb } from "@/hooks/use-my-lamb";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { DevotionSection } from "@/features/lamb-info/components/devotion-section";
import { DevotionStatTiles } from "@/features/lamb-info/components/devotion-stat-tiles";
import { MyDevotionFan } from "@/features/roadmap/components/my-devotion-fan";
import { BibleProgressCard } from "./components/bible-progress-card";
import { DevotionCalendarCard } from "./components/devotion-calendar-card";
import { MyGiftRadarCard } from "./components/my-gift-radar-card";
import { MyProfileAvatar } from "./components/my-profile-avatar";
import { OnThisDayCard } from "./components/on-this-day-card";
import { PrayerSummary } from "./components/prayer-summary";
import { TodayStreakCard } from "./components/today-streak-card";
import { VerseOfTheDayCard } from "./components/verse-of-the-day-card";

// Dashboard จิตวิญญาณและเฝ้าเดี่ยวของตัวเอง (/spiritual, grill-me 2026-11-15):
// - ข้อมูลของคนที่ล็อกอินเท่านั้น (useMyLamb) ทุกคนมีหน้าของตัวเอง ไม่มีใคร
//   เห็นของคนอื่น — คำอธิษฐาน/แอนดรูเป็นข้อมูลส่วนตัวอยู่แล้ว
// - เป็นหน้าแรกของ member/visitor (routes/_authenticated/index.tsx redirect
//   "/" มาที่นี่; role อื่นไป /dashboard) ทุก role เข้าได้ทั้งสองหน้าจากเมนู
// - เรียงจากบนลงล่าง: ข้อพระคัมภีร์ประจำวัน (YouVersion) + วันนี้เฝ้าหรือยัง/
//   วันต่อเนื่อง → การ์ดพัดเฝ้าเดี่ยวของตัวเอง (ตัวเดียวกับ /roadmap, เพิ่ม
//   2026-11-15) → สถิติเฝ้าเดี่ยวแบบเดียวกับหน้าประวัติ (ใช้ component เดิม)
//   → คำอธิษฐาน / สิ่งที่พระเจ้าคุยด้วย / แอนดรู / ที่พระเจ้าตอบแล้ว →
//   วันนี้ในอดีต → radar ของประทานและคะแนน
export function Spiritual() {
  const myLamb = useMyLamb();
  const lambId = myLamb.data?.id;
  // คงที่ตลอดอายุของหน้า — "วันนี้" ไม่ขยับกลางคัน (แบบเดียวกับ DevotionSection)
  const [today] = useState(() => new Date());
  const isLoading = myLamb.isResolvingUser || myLamb.isLoading;

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-6 sm:gap-8">
        {/* หัวหน้าแบบโปรไฟล์: รูปสี่เหลี่ยมมน 96/128px + ชื่อ (grill-me 2026-11-18;
            ลองย้ายไปแถวข้อพระคัมภีร์แล้วไม่เวิร์ค เลยกลับมาที่นี่) */}
        <div className="flex items-center gap-4 sm:gap-6">
          {isLoading ? (
            <Skeleton className="size-24 shrink-0 rounded-xl sm:size-32" />
          ) : myLamb.data ? (
            <MyProfileAvatar
              lamb={myLamb.data}
              className="size-24 sm:size-32"
            />
          ) : null}
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight">
              จิตวิญญาณของฉัน
              {myLamb.data
                ? ` — ${myLamb.data.nick_name ?? myLamb.data.first_name}`
                : ""}
            </h2>
            <p className="text-muted-foreground">
              ภาพรวมเฝ้าเดี่ยว คำอธิษฐาน และการเติบโตของคุณ
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* ข้อประจำวัน + วันนี้ในอดีต (พื้นหลังรูปจาก Pexels) ซ้อนกันในคอลัมน์ซ้าย
              (grill-me 2026-11-18) */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <VerseOfTheDayCard today={today} />
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : lambId ? (
              <OnThisDayCard lambId={lambId} today={today} />
            ) : null}
          </div>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : lambId ? (
            // สถิติต่อเนื่อง + ปฏิทินเฝ้าเดี่ยวซ้อนกันในคอลัมน์ขวา (grill-me 2026-11-18)
            <div className="flex flex-col gap-4">
              <TodayStreakCard lambId={lambId} />
              <DevotionCalendarCard lambId={lambId} today={today} />
            </div>
          ) : null}
        </div>

        {myLamb.error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
            <AlertDescription>{myLamb.error.message}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : !lambId ? (
          <p className="text-muted-foreground py-8 text-center">
            บัญชีนี้ยังไม่ได้ผูกกับข้อมูลสมาชิก จึงไม่มีสถิติส่วนตัวให้แสดง
          </p>
        ) : (
          <>
            {/* การ์ดพัดเฝ้าเดี่ยวของตัวเอง — ตัวเดียวกับหน้า /roadmap */}
            <MyDevotionFan embedded />

            {/* ความคืบหน้าการอ่านพระคัมภีร์ (grill-me 2026-11-16) */}
            <BibleProgressCard />

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">สถิติเฝ้าเดี่ยว</h3>
              <DevotionStatTiles lambId={lambId} />
              <DevotionSection lambId={lambId} />
            </section>

            <PrayerSummary lambId={lambId} />

            <MyGiftRadarCard lambId={lambId} />
          </>
        )}
      </Main>
    </>
  );
}
