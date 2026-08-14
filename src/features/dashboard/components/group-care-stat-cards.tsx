import { LayoutGrid, UsersRound } from "lucide-react";
import { StatCard } from "./stat-card";
import type { GroupCareStats } from "../lib/aggregate";

type GroupCareStatCardsProps = {
  stats: GroupCareStats;
};

// 2 การ์ดสรุปกลุ่มแคร์ — ไม่นับแถว sentinel/placeholder "all"/"none" ทั้งจำนวน
// กลุ่มและตัวเศษของขนาดเฉลี่ย (คนที่ group_care ชี้ไปกลุ่มพวกนี้ถือว่ายังไม่มี
// กลุ่มจริง) ขนาดเฉลี่ยคิดจาก "สมาชิก active ที่มีกลุ่มจริง / จำนวนกลุ่มจริง
// ทั้งหมด" (รวมกลุ่มที่ยังไม่มีสมาชิกด้วย ไม่ใช่เฉลี่ยเฉพาะกลุ่มที่มีคนแล้ว)
// ตกลงใน grill-me 2026-08-14 รอบสอง+รอบสาม (`dashboard_design`)
export function GroupCareStatCards({ stats }: GroupCareStatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard
        title="จำนวนกลุ่มแคร์"
        value={stats.totalGroups}
        icon={LayoutGrid}
      />
      <StatCard
        title="ขนาดเฉลี่ยต่อกลุ่ม"
        value={stats.averageSize === null ? "–" : `${stats.averageSize} คน`}
        icon={UsersRound}
        description="สมาชิก active ที่มีกลุ่มจริง ÷ จำนวนกลุ่มจริงทั้งหมด"
      />
    </div>
  );
}
