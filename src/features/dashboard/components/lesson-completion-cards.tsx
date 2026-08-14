import { BookOpenCheck, GraduationCap } from "lucide-react";
import { StatCard } from "./stat-card";
import type { LessonCompletionStats } from "../lib/aggregate";

type LessonCompletionCardsProps = {
  stats: LessonCompletionStats;
};

// จำนวนสมาชิก active ที่จบครบหลักสูตรแล้ว — "จบครบ" อิงตัวเลขรวมเดียวกับ
// GrowthProgressCard ของโปรไฟล์รายคน (18 บท / 36 หัวข้อลักษณะชีวิตคริสเตียน)
// ตกลงใน grill-me 2026-08-14 รอบสอง (`dashboard_design`)
export function LessonCompletionCards({ stats }: LessonCompletionCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard
        title="จบครบ 18 บท"
        value={`${stats.chapterCompletedCount} / ${stats.activeCount}`}
        icon={BookOpenCheck}
        description="สมาชิก active ที่เรียนจบทุกบท"
      />
      <StatCard
        title="จบครบลักษณะชีวิตคริสเตียน"
        value={`${stats.lifeCompletedCount} / ${stats.activeCount}`}
        icon={GraduationCap}
        description="สมาชิก active ที่จบครบ 36 หัวข้อ (ตอน 1-2)"
      />
    </div>
  );
}
