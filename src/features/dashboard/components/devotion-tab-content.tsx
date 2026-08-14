import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DevotionOverviewSummary } from "@/features/devotion-overview/components/devotion-overview-summary";
import { DevotionMonthlyTable } from "@/features/devotion-overview/components/devotion-monthly-table";
import { DevotionYearlyTable } from "@/features/devotion-overview/components/devotion-yearly-table";
import type { DevotionOverviewMember } from "@/features/devotion-overview/data/schema";

type DevotionTabContentProps = {
  today: Date;
  members: DevotionOverviewMember[];
  entriesByLamb: Map<string, Set<string>>;
  percent: number | null;
};

// เนื้อหา "ภาพรวมการเฝ้าเดี่ยว" ทั้งหมด (การ์ดสรุป + ตารางรายเดือน/รายปี) —
// ย้ายมาจากหน้าแยก /devotion-overview เข้ามาเป็น tab ในหน้า Dashboard ตกลง
// ใน grill-me 2026-08-14 รอบห้า (`dashboard_design`): หน้า /devotion-overview
// เดิมถูกลบไปแล้ว (พร้อมลิงก์ sidebar), ไม่มีหัวข้อ/คำอธิบายซ้ำเพราะ tab label
// "เฝ้าเดี่ยว" สื่อความหมายอยู่แล้ว — ใช้ query/aggregation/component ย่อยเดิม
// ของ devotion-overview ทั้งหมด (ไม่ reimplement) รับ members/entriesByLamb/
// percent มาจาก Dashboard เพราะ Dashboard ดึงข้อมูลชุดนี้อยู่แล้วสำหรับ
// devotionPercent เดิม ไม่ query ซ้ำ
export function DevotionTabContent({
  today,
  members,
  entriesByLamb,
  percent,
}: DevotionTabContentProps) {
  const [view, setView] = useState<"month" | "year">("month");

  return (
    <div className="space-y-4">
      <DevotionOverviewSummary memberCount={members.length} percent={percent} />

      <Tabs value={view} onValueChange={(v) => setView(v as "month" | "year")}>
        <TabsList>
          <TabsTrigger value="month">รายเดือน</TabsTrigger>
          <TabsTrigger value="year">รายปี</TabsTrigger>
        </TabsList>
        <TabsContent value="month">
          <DevotionMonthlyTable
            today={today}
            members={members}
            entriesByLamb={entriesByLamb}
          />
        </TabsContent>
        <TabsContent value="year">
          <DevotionYearlyTable
            today={today}
            members={members}
            entriesByLamb={entriesByLamb}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
