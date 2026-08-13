import { CircleCheckBig, HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CHRISTIAN_LIFE_LESSONS_PART1,
  CHRISTIAN_LIFE_LESSONS_PART2,
  GROWTH_LESSONS,
  type GrowthLesson,
} from "../data/lessons";

// Driven by `lamb_info.lamb_lesson_ch18_progress` (a count of chapters
// completed, e.g. 7 means chapters 1-7 are done) และ
// `lamb_info.lamb_lesson_life_progress` (นับต่อเนื่อง 0-36 สำหรับหลักสูตร
// "ลักษณะชีวิตคริสเตียน" — 1-18 = ตอน 1 กำลังทำ, 19-36 = ตอน 1 จบแล้วทำตอน 2
// ต่อ ดู grill-me 2026-08-13, `attendance_mobile_layout`-adjacent memory
// `lamb_lesson_life_progress`) — read-only for now. Checkboxes are
// disabled: there's no mutation/save path yet, only display. See
// lamb-info-action-dialog.tsx if/when editing this value is wired in.
//
// The "ministry" section below still has no backing data on `lamb_info`
// (no role/start-date columns), so it stays as placeholder text.
type GrowthProgressCardProps = {
  chapterProgress: number | null;
  lifeProgress: number | null;
};

// Checklist บล็อกเดียว ใช้ซ้ำทั้ง 3 หลักสูตร (18 บท + ลักษณะชีวิตคริสเตียน 2
// ตอน) — ต่างกันแค่หัวข้อ label และ prefix ของแต่ละรายการ
type LessonChecklistProps = {
  icon: React.ReactNode;
  title: string;
  lessons: GrowthLesson[];
  completedCount: number;
  itemPrefix: string;
  showBadge?: boolean;
};

function LessonChecklist({
  icon,
  title,
  lessons,
  completedCount,
  itemPrefix,
  showBadge,
}: LessonChecklistProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          {icon}
          {title}
        </div>
        {showBadge && (
          <span className="text-xs text-muted-foreground">
            ข้อมูลจริงจากระบบ — แก้ไขยังไม่ได้ตอนนี้
          </span>
        )}
      </div>
      <div className="rounded-lg bg-teal-50/60 p-4 dark:bg-teal-950/20">
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {lessons.map((lesson) => {
            const isChecked = lesson.id <= completedCount;
            return (
              <label
                key={lesson.id}
                className="flex items-center gap-2 py-0.5 text-sm"
              >
                <Checkbox
                  checked={isChecked}
                  disabled
                  className="data-[state=checked]:border-teal-600 data-[state=checked]:bg-teal-600 dark:data-[state=checked]:bg-teal-600"
                />
                <span
                  className={cn(
                    isChecked &&
                      "text-teal-700 line-through dark:text-teal-400",
                  )}
                >
                  {itemPrefix} {lesson.id}: {lesson.title}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function GrowthProgressCard({
  chapterProgress,
  lifeProgress,
}: GrowthProgressCardProps) {
  const completedCount = chapterProgress ?? 0;

  // lamb_lesson_life_progress นับต่อเนื่อง 0-36 คอลัมน์เดียว — แบ่งออกเป็น
  // ตอน 1 (1-18) และตอน 2 (19-36) ฝั่ง client (ดู grill-me 2026-08-13)
  const lifeCompletedCount = lifeProgress ?? 0;
  const part1CompletedCount = Math.min(lifeCompletedCount, 18);
  const part2CompletedCount = Math.max(lifeCompletedCount - 18, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress การเติบโต</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <LessonChecklist
          icon={<CircleCheckBig className="size-4 text-teal-600" />}
          title="บทเรียนที่ศึกษาแล้ว"
          lessons={GROWTH_LESSONS}
          completedCount={completedCount}
          itemPrefix="บทที่"
          showBadge
        />

        <LessonChecklist
          icon={<CircleCheckBig className="size-4 text-teal-600" />}
          title="ลักษณะชีวิตคริสเตียน ตอน 1"
          lessons={CHRISTIAN_LIFE_LESSONS_PART1}
          completedCount={part1CompletedCount}
          itemPrefix="หัวข้อที่"
        />

        <LessonChecklist
          icon={<CircleCheckBig className="size-4 text-teal-600" />}
          title="ลักษณะชีวิตคริสเตียน ตอน 2"
          lessons={CHRISTIAN_LIFE_LESSONS_PART2}
          completedCount={part2CompletedCount}
          itemPrefix="หัวข้อที่"
        />

        <div>
          <div className="mb-3 flex items-center gap-2 font-medium">
            <HandHeart className="size-4 text-teal-600" />
            การเริ่มรับใช้ (ถ้ามี)
          </div>
          <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">
                ตำแหน่งที่รับใช้
              </div>
              <div className="mt-1 text-sm text-muted-foreground italic">
                ยังไม่มีข้อมูล
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                วันที่เริ่มรับใช้
              </div>
              <div className="mt-1 text-sm text-muted-foreground italic">
                ยังไม่มีข้อมูล
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
