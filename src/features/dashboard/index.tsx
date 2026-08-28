import { useMemo, useState } from "react";
import { AlertCircle, CalendarHeart, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  useDevotionOverviewEntries,
  useDevotionOverviewMembers,
} from "@/features/devotion-overview/data/queries";
import { buildYearlyMonths } from "@/features/devotion-overview/lib/aggregate";
import { AgeDistributionChart } from "./components/age-distribution-chart";
import { AttendanceTrendChart } from "./components/attendance-trend-chart";
import { BirthdayThisMonthCard } from "./components/birthday-this-month-card";
import { DevotionTabContent } from "./components/devotion-tab-content";
import { GiftHighlightCards } from "./components/gift-highlight-cards";
import { GiftRadarChart } from "./components/gift-radar-chart";
import { GroupCareStatCards } from "./components/group-care-stat-cards";
import { LessonCompletionCards } from "./components/lesson-completion-cards";
import { MemberStatCards } from "./components/member-stat-cards";
import { PersonalityDistributionChart } from "./components/personality-distribution-chart";
import { StatCard } from "./components/stat-card";
import {
  useDashboardAttendance,
  useDashboardGifts,
  useDashboardGroupCareList,
  useDashboardLambs,
  useDashboardPersonalityTypes,
} from "./data/queries";
import {
  computeAgeStats,
  computeAttendanceTrend,
  computeBirthdaysThisMonth,
  computeGenderCounts,
  computeGiftAverages,
  computeGiftStats,
  computeGroupCareStats,
  computeLessonCompletionStats,
  computeMemberCounts,
  computePersonalityDistribution,
  getRecentWeekStarts,
} from "./lib/aggregate";

// สรุปข้อมูลทั้งโบส — แทนที่ template shadcn เดิม (Total Revenue,
// Subscriptions, Sales, Active Now, กราฟ/รายการปลอมที่ไม่เกี่ยวกับโบส) ด้วย
// สถิติแกะจริง โครง UI เดิม (Header, TopNav 4 เมนู 3 อัน disabled, ปุ่ม
// Download placeholder, Tabs) คงไว้ตามที่ตกลง — ตกลงใน
// grill-me 2026-08-14 (`dashboard_design` ใน project memory):
//   - Overview tab = สมาชิกทั้งหมด/active/ผู้นำ/สมาชิกทั่วไป + เกิดเดือนนี้
//   - Analytics tab = ชาย/หญิง, อายุเฉลี่ย, ช่วงอายุ, ของประทาน
//   - เฝ้าเดี่ยว tab = ภาพรวมการเฝ้าเดี่ยวทั้งโบสแบบเต็มรูป (การ์ดสรุป +
//     ตารางรายเดือน/รายปี) — ย้ายมาจากหน้าแยก /devotion-overview ทั้งหมดใน
//     grill-me รอบห้า (`dashboard_design`), หน้าเดิม+ลิงก์ sidebar ถูกลบแล้ว
//   - ไม่ scope ตาม role/group (เหมือน devotion-overview เดิม) เพราะ RBAC ยังไม่ apply จริง
//   - aggregate ฝั่ง client ทั้งหมด ไม่มี RPC ใหม่ (คู่กับ devotion-overview)
export function Dashboard() {
  // Stable ตลอดอายุ component เดียวกับ pattern ของ devotion-overview — กัน
  // "วันนี้" ขยับกลางเซสชันจนตัวเลขไม่นิ่ง
  const [today] = useState(() => new Date());

  const {
    data: lambs,
    isPending: isLambsPending,
    isError: isLambsError,
  } = useDashboardLambs();
  const {
    data: giftRows,
    isPending: isGiftsPending,
    isError: isGiftsError,
  } = useDashboardGifts();
  const {
    data: groupCareList,
    isPending: isGroupCareListPending,
    isError: isGroupCareListError,
  } = useDashboardGroupCareList();
  const {
    data: personalityTypes,
    isPending: isPersonalityTypesPending,
    isError: isPersonalityTypesError,
  } = useDashboardPersonalityTypes();

  // เทรนด์มาโบสถ์/แคร์ 12 สัปดาห์ล่าสุด — ใช้สมาชิก active ปัจจุบันเป็น
  // ขอบเขตคงที่ (ตัว lambIds เดียวกับที่ใช้คำนวณสถิติอื่นๆ ด้านล่าง)
  const activeLambIds = useMemo(
    () => (lambs ?? []).filter((l) => l.status === true).map((l) => l.id),
    [lambs],
  );
  const recentWeekStarts = useMemo(
    () => getRecentWeekStarts(today, 12),
    [today],
  );
  const {
    data: attendanceRows,
    isPending: isAttendancePending,
    isError: isAttendanceError,
  } = useDashboardAttendance(activeLambIds, recentWeekStarts[0]);

  // เฝ้าเดี่ยวเฉลี่ยทั้งโบส (เดือนนี้) — ใช้ query + สูตรคำนวณเดียวกับหน้า
  // /devotion-overview (ไม่ reimplement) เพื่อให้ตัวเลข 2 หน้าตรงกันเสมอ
  const {
    data: devotionMembers,
    isPending: isDevotionMembersPending,
    isError: isDevotionMembersError,
  } = useDevotionOverviewMembers();
  const devotionLambIds = useMemo(
    () => (devotionMembers ?? []).map((m) => m.id),
    [devotionMembers],
  );
  const {
    data: devotionEntries,
    isPending: isDevotionEntriesPending,
    isError: isDevotionEntriesError,
  } = useDevotionOverviewEntries(devotionLambIds);

  // ใช้ทั้งคำนวณ devotionPercent (สรุปสั้นๆ) และป้อนเข้า DevotionTabContent
  // (ตารางรายเดือน/รายปีเต็มรูป) — ตัวเดียวกัน ไม่สร้างซ้ำ
  const devotionEntriesByLamb = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const entry of devotionEntries ?? []) {
      const set = map.get(entry.lamb_id) ?? new Set<string>();
      set.add(entry.devotion_date);
      map.set(entry.lamb_id, set);
    }
    return map;
  }, [devotionEntries]);

  const devotionPercent = useMemo(() => {
    if (!devotionMembers) return null;
    let totalElapsed = 0;
    let totalCount = 0;
    for (const member of devotionMembers) {
      const months = buildYearlyMonths(
        today,
        devotionEntriesByLamb.get(member.id) ?? new Set(),
      );
      const currentMonth = months[months.length - 1];
      totalElapsed += currentMonth.elapsedDays;
      totalCount += currentMonth.count;
    }
    return totalElapsed === 0
      ? null
      : Math.round((totalCount / totalElapsed) * 100);
  }, [devotionMembers, devotionEntriesByLamb, today]);

  const memberCounts = useMemo(() => computeMemberCounts(lambs ?? []), [lambs]);
  const birthdaysThisMonth = useMemo(
    () => computeBirthdaysThisMonth(lambs ?? [], today),
    [lambs, today],
  );
  const genderCounts = useMemo(() => computeGenderCounts(lambs ?? []), [lambs]);
  // toggle "ไม่นับ Pastor" สำหรับอายุเฉลี่ย+กราฟช่วงอายุ — ปิดไว้เป็น default
  // (นับรวม Pastor) ตกลงใน grill-me 2026-08-28
  const [excludePastor, setExcludePastor] = useState(false);
  const ageStats = useMemo(
    () => computeAgeStats(lambs ?? [], today, excludePastor),
    [lambs, today, excludePastor],
  );
  const giftAverages = useMemo(
    () => computeGiftAverages(giftRows ?? []),
    [giftRows],
  );
  const giftStats = useMemo(() => computeGiftStats(giftRows ?? []), [giftRows]);
  const groupCareStats = useMemo(
    () => computeGroupCareStats(lambs ?? [], groupCareList ?? []),
    [lambs, groupCareList],
  );
  const attendanceTrend = useMemo(
    () =>
      computeAttendanceTrend(
        recentWeekStarts,
        activeLambIds.length,
        attendanceRows ?? [],
      ),
    [recentWeekStarts, activeLambIds, attendanceRows],
  );
  const personalityDistribution = useMemo(
    () => computePersonalityDistribution(lambs ?? [], personalityTypes ?? []),
    [lambs, personalityTypes],
  );
  const lessonCompletionStats = useMemo(
    () => computeLessonCompletionStats(lambs ?? []),
    [lambs],
  );

  const isPending =
    isLambsPending ||
    isGiftsPending ||
    isDevotionMembersPending ||
    isDevotionEntriesPending ||
    isGroupCareListPending ||
    isPersonalityTypesPending ||
    isAttendancePending;
  const isError =
    isLambsError ||
    isGiftsError ||
    isDevotionMembersError ||
    isDevotionEntriesError ||
    isGroupCareListError ||
    isPersonalityTypesError ||
    isAttendanceError;

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} className="me-auto" />
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className="mb-2 flex items-center justify-between space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Button>Download</Button>
          </div>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
            <AlertDescription>ลองรีเฟรชหน้านี้อีกครั้ง</AlertDescription>
          </Alert>
        ) : isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs
            orientation="vertical"
            defaultValue="overview"
            className="space-y-4"
          >
            <div className="w-full overflow-x-auto pb-2">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="reports" disabled>
                  Reports
                </TabsTrigger>
                <TabsTrigger value="notifications" disabled>
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="devotion">เฝ้าเดี่ยว</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-4">
              <MemberStatCards counts={memberCounts} />
              <GroupCareStatCards stats={groupCareStats} />
              <AttendanceTrendChart data={attendanceTrend} />
              <BirthdayThisMonthCard lambs={birthdaysThisMonth} today={today} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard title="ชาย" value={genderCounts.male} icon={Users} />
                <StatCard
                  title="หญิง"
                  value={genderCounts.female}
                  icon={Users}
                />
                <StatCard
                  title="อายุเฉลี่ยทั้งโบส"
                  value={
                    ageStats.averageAge === null
                      ? "–"
                      : `${ageStats.averageAge} ปี`
                  }
                  icon={CalendarHeart}
                  description="คำนวณจากวันเกิด"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="exclude-pastor"
                  checked={excludePastor}
                  onCheckedChange={setExcludePastor}
                />
                <Label htmlFor="exclude-pastor" className="text-sm font-normal">
                  ไม่นับ Pastor ในอายุเฉลี่ย/ช่วงอายุ
                </Label>
              </div>
              <AgeDistributionChart brackets={ageStats.brackets} />
              <GiftRadarChart
                averages={giftAverages}
                assessedCount={giftStats.assessedCount}
              />
              <GiftHighlightCards stats={giftStats} />
              <LessonCompletionCards stats={lessonCompletionStats} />
              <PersonalityDistributionChart data={personalityDistribution} />
            </TabsContent>

            <TabsContent value="devotion" className="space-y-4">
              <DevotionTabContent
                today={today}
                members={devotionMembers ?? []}
                entriesByLamb={devotionEntriesByLamb}
                percent={devotionPercent}
              />
            </TabsContent>
          </Tabs>
        )}
      </Main>
    </>
  );
}

const topNav = [
  {
    title: "Overview",
    href: "dashboard/overview",
    isActive: true,
    disabled: false,
  },
  {
    title: "Customers",
    href: "dashboard/customers",
    isActive: false,
    disabled: true,
  },
  {
    title: "Products",
    href: "dashboard/products",
    isActive: false,
    disabled: true,
  },
  {
    title: "Settings",
    href: "dashboard/settings",
    isActive: false,
    disabled: true,
  },
];
