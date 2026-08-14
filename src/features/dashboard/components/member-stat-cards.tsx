import { Crown, User, UserCheck, Users } from "lucide-react";
import { StatCard } from "./stat-card";
import type { MemberCounts } from "../lib/aggregate";

type MemberStatCardsProps = {
  counts: MemberCounts;
};

// 4 การ์ดสรุปจำนวนสมาชิก — ตกลงใน grill-me 2026-08-14 (`dashboard_design`):
// "สมาชิกทั้งหมด" นับทุกแถว (active+inactive) ส่วนอีก 3 การ์ดคำนวณจากสมาชิก
// active เท่านั้น (ผู้นำ = is_leader_group_care หรือมีคำว่า "leader" ใน tags,
// สมาชิกทั่วไป = active ลบผู้นำ ไม่ทับซ้อนกัน — ผลรวมของทั้ง 2 การ์ดนี้ =
// active เสมอ)
export function MemberStatCards({ counts }: MemberStatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="สมาชิกทั้งหมด"
        value={counts.total}
        icon={Users}
        description="รวม active และ inactive"
      />
      <StatCard
        title="Active"
        value={counts.active}
        icon={UserCheck}
        description="สถานะยังใช้งานอยู่"
      />
      <StatCard
        title="ผู้นำ"
        value={counts.leaders}
        icon={Crown}
        description="Active ที่เป็นผู้นำ"
      />
      <StatCard
        title="สมาชิกทั่วไป"
        value={counts.regularMembers}
        icon={User}
        description="Active ที่ไม่ใช่ผู้นำ"
      />
    </div>
  );
}
