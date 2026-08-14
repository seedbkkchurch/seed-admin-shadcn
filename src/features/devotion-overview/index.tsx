import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DevotionOverviewSummary } from "./components/devotion-overview-summary";
import { DevotionMonthlyTable } from "./components/devotion-monthly-table";
import { DevotionYearlyTable } from "./components/devotion-yearly-table";
import {
  useDevotionOverviewEntries,
  useDevotionOverviewMembers,
} from "./data/queries";
import { buildYearlyMonths } from "./lib/aggregate";

// ภาพรวมการเฝ้าเดี่ยวของทุกคนในโบส — สะท้อนภาพรวมทั้งโบสในหน้าเดียว ต่างจาก
// devotion-section.tsx (ประวัติของ "คนเดียว" บนหน้าโปรไฟล์) และหน้า attendance
// (เช็คชื่อรายสัปดาห์แยกตามกลุ่มแคร์) — ดีไซน์นี้มาจาก grill-me 2026-08-14
// (`devotion_overview_design` ใน project memory), สรุปการตัดสินใจหลัก:
//   - ตัวเลขหลักคือ % ไม่ใช่จำนวนครั้งดิบ (แก้ปัญหาแต่ละเดือน/สัปดาห์วันไม่เท่ากัน)
//   - รายเดือน = ตาราง สัปดาห์ยืดหดตามจริง, รายปี = แท่งเขียว 12 เดือนล่าสุด
//   - fixed rolling ไม่มีตัวเลือกเดือน/ปี, เฉพาะสมาชิก active, เรียงชื่อ A-Z
//   - คลิกชื่อ → ลิงก์ไปหน้าโปรไฟล์แกะ (/lamb-info/$lambId)
export function DevotionOverview() {
  // Stable for the component's lifetime so "today" doesn't shift the
  // rolling windows mid-session — เดียวกับ pattern ใน devotion-section.tsx
  const [today] = useState(() => new Date());
  const [view, setView] = useState<"month" | "year">("month");

  const {
    data: members,
    isPending: isMembersPending,
    isError: isMembersError,
  } = useDevotionOverviewMembers();

  const activeLambIds = useMemo(
    () => (members ?? []).map((m) => m.id),
    [members],
  );

  const {
    data: entries,
    isPending: isEntriesPending,
    isError: isEntriesError,
  } = useDevotionOverviewEntries(activeLambIds);

  const entriesByLamb = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const entry of entries ?? []) {
      const set = map.get(entry.lamb_id) ?? new Set<string>();
      set.add(entry.devotion_date);
      map.set(entry.lamb_id, set);
    }
    return map;
  }, [entries]);

  // สรุปทั้งโบสของเดือนนี้ — รวมนับทุกคนก่อนแล้วค่อยหา % (ไม่ใช่เฉลี่ยของ %
  // แต่ละคน) กันสมาชิกจำนวนวันเข้าร่วมน้อยบิดค่าเฉลี่ยเกินจริง
  const monthlySummaryPercent = useMemo(() => {
    if (!members) return null;
    let totalElapsed = 0;
    let totalCount = 0;
    for (const member of members) {
      const memberMonths = buildYearlyMonths(
        today,
        entriesByLamb.get(member.id) ?? new Set(),
      );
      const currentMonth = memberMonths[memberMonths.length - 1];
      totalElapsed += currentMonth.elapsedDays;
      totalCount += currentMonth.count;
    }
    return totalElapsed === 0
      ? null
      : Math.round((totalCount / totalElapsed) * 100);
  }, [members, entriesByLamb, today]);

  const isPending = isMembersPending || isEntriesPending;
  const isError = isMembersError || isEntriesError;

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            ภาพรวมการเฝ้าเดี่ยว
          </h2>
          <p className="text-muted-foreground">
            สรุปอัตราการเฝ้าเดี่ยวของสมาชิกทุกคน สะท้อนภาพรวมทั้งโบส
          </p>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
            <AlertDescription>ลองรีเฟรชหน้านี้อีกครั้ง</AlertDescription>
          </Alert>
        ) : isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <>
            <DevotionOverviewSummary
              memberCount={members?.length ?? 0}
              percent={monthlySummaryPercent}
            />

            <Tabs value={view} onValueChange={(v) => setView(v as "month" | "year")}>
              <TabsList>
                <TabsTrigger value="month">รายเดือน</TabsTrigger>
                <TabsTrigger value="year">รายปี</TabsTrigger>
              </TabsList>
              <TabsContent value="month">
                <DevotionMonthlyTable
                  today={today}
                  members={members ?? []}
                  entriesByLamb={entriesByLamb}
                />
              </TabsContent>
              <TabsContent value="year">
                <DevotionYearlyTable
                  today={today}
                  members={members ?? []}
                  entriesByLamb={entriesByLamb}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </Main>
    </>
  );
}
