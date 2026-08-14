import { NotebookPen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type DevotionOverviewSummaryProps = {
  memberCount: number;
  percent: number | null;
};

// สรุปภาพรวมทั้งโบสของเดือนนี้ — ตอบโจทย์ "ผู้นำ/อภิบาล" อยากเห็นทันทีโดยไม่ต้อง
// ไล่อ่านตาราง (ตกลงใน grill-me 2026-08-14, `devotion_overview_design`) เดียว
// กับ pattern StatTile ของหน้า attendance (attendance-summary.tsx) แต่มีแค่
// การ์ดเดียวเพราะเฝ้าเดี่ยวมี metric เดียว (ต่างจาก attendance ที่มี 2 metric)
export function DevotionOverviewSummary({
  memberCount,
  percent,
}: DevotionOverviewSummaryProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <NotebookPen className="size-4" />
          <span className="text-sm font-medium">
            อัตราเฝ้าเดี่ยวเฉลี่ยทั้งโบส (เดือนนี้)
          </span>
        </div>
        <div className="text-4xl font-bold tracking-tight sm:text-5xl">
          {percent === null ? "–" : `${percent}%`}
        </div>
        <div className="text-sm text-muted-foreground">
          จากสมาชิก active {memberCount} คน
        </div>
      </CardContent>
    </Card>
  );
}
