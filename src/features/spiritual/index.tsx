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
import { MyGiftRadarCard } from "./components/my-gift-radar-card";
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
        <div>
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

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <VerseOfTheDayCard today={today} />
          </div>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : lambId ? (
            <TodayStreakCard lambId={lambId} />
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

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">สถิติเฝ้าเดี่ยว</h3>
              <DevotionStatTiles lambId={lambId} />
              <DevotionSection lambId={lambId} />
            </section>

            <PrayerSummary lambId={lambId} />

            <div className="grid gap-4 lg:grid-cols-3">
              <OnThisDayCard lambId={lambId} today={today} />
              <div className="lg:col-span-2">
                <MyGiftRadarCard lambId={lambId} />
              </div>
            </div>
          </>
        )}
      </Main>
    </>
  );
}
