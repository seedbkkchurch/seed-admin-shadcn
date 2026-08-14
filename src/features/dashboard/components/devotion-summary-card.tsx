import { Link } from "@tanstack/react-router";
import { NotebookPen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DevotionSummaryCardProps = {
  percent: number | null;
};

// ใช้ query + aggregation เดียวกับหน้า /devotion-overview (ไม่ reimplement
// การคำนวณใหม่) เพื่อไม่ให้ตัวเลขไม่ตรงกันระหว่าง 2 หน้า — ตกลงใน grill-me
// 2026-08-14 (`dashboard_design` ใน project memory)
export function DevotionSummaryCard({ percent }: DevotionSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          ภาพรวมเฝ้าเดี่ยว (เดือนนี้)
        </CardTitle>
        <NotebookPen className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {percent === null ? "–" : `${percent}%`}
        </div>
        <Link
          to="/devotion-overview"
          className="text-xs text-muted-foreground hover:underline"
        >
          ดูรายละเอียด →
        </Link>
      </CardContent>
    </Card>
  );
}
