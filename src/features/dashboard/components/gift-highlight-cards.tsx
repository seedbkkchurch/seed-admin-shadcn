import { TrendingDown, TrendingUp } from "lucide-react";
import { StatCard } from "./stat-card";
import type { GiftStats } from "../lib/aggregate";

type GiftHighlightCardsProps = {
  stats: GiftStats;
};

// ของประทานที่มีคะแนนเฉลี่ยสูงสุด/ต่ำสุดในโบส เฉลี่ยเฉพาะคนที่ทำแบบประเมิน
// แล้ว (ดู computeGiftStats) — ตกลงใน grill-me 2026-08-14 (`dashboard_design`)
// แสดงแค่ top1/bottom1 เป็น 2 การ์ดเล็ก
export function GiftHighlightCards({ stats }: GiftHighlightCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard
        title="ของประทานที่มีเยอะสุด"
        value={stats.top ? stats.top.name : "–"}
        icon={TrendingUp}
        description={
          stats.top
            ? `เฉลี่ย ${stats.top.average.toFixed(1)} คะแนน จาก ${stats.assessedCount} คนที่ทำแบบประเมิน`
            : "ยังไม่มีคนทำแบบประเมิน"
        }
      />
      <StatCard
        title="ของประทานที่มีน้อยสุด"
        value={stats.bottom ? stats.bottom.name : "–"}
        icon={TrendingDown}
        description={
          stats.bottom
            ? `เฉลี่ย ${stats.bottom.average.toFixed(1)} คะแนน จาก ${stats.assessedCount} คนที่ทำแบบประเมิน`
            : "ยังไม่มีคนทำแบบประเมิน"
        }
      />
    </div>
  );
}
