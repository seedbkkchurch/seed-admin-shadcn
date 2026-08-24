import { CircleCheckBig, HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpdateLambInfo } from "../data/queries";
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
// `lamb_lesson_life_progress`).
//
// Editable (grill-me 2026-08-24) by: the profile's own owner, or a role in
// {cell_leader, team_leader, admin, super_admin} — see `canEdit` prop,
// computed by the caller (profile.tsx) via useMyLamb()/useMyRoles(). This
// is a CLIENT-SIDE-ONLY permission check — `lamb_info` RLS is wide open to
// any authenticated user (confirmed live via Supabase MCP), same as every
// other write path in this app today; there's no DB-level guard specific
// to this field (unlike `role`, which has its own BEFORE UPDATE trigger).
// Clicking lesson N sets the underlying progress column straight to N (or
// N-1 when unchecking) and auto-saves immediately — no separate edit
// mode/save button. Each checklist "section" (18-chapter list, life part1,
// life part2) is independently checkable per lesson.
//
// The "ministry" section below still has no backing data on `lamb_info`
// (no role/start-date columns), so it stays as placeholder text.
type GrowthProgressCardProps = {
  lambId: string;
  chapterProgress: number | null;
  lifeProgress: number | null;
  canEdit: boolean;
};

// Checklist บล็อกเดียว ใช้ซ้ำทั้ง 3 หลักสูตร (18 บท + ลักษณะชีวิตคริสเตียน 2
// ตอน) — ต่างกันแค่หัวข้อ label, prefix ของแต่ละรายการ, และวิธีแปลง lesson id
// ที่ถูกคลิกให้เป็นค่า progress สัมบูรณ์ที่จะเซฟ (toProgressValue)
type LessonChecklistProps = {
  icon: React.ReactNode;
  title: string;
  lessons: GrowthLesson[];
  completedCount: number;
  itemPrefix: string;
  showBadge?: boolean;
  canEdit: boolean;
  onToggle?: (lessonId: number, checked: boolean) => void;
  pendingLessonId?: number | null;
};

function LessonChecklist({
  icon,
  title,
  lessons,
  completedCount,
  itemPrefix,
  showBadge,
  canEdit,
  onToggle,
  pendingLessonId,
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
            {canEdit ? "ข้อมูลจริงจากระบบ" : "ข้อมูลจริงจากระบบ — แก้ไขได้เฉพาะเจ้าของ/หัวหน้าแคร์/แอดมิน"}
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
                className={cn(
                  "flex items-center gap-2 py-0.5 text-sm",
                  canEdit && "cursor-pointer",
                )}
              >
                <Checkbox
                  checked={isChecked}
                  disabled={!canEdit || pendingLessonId === lesson.id}
                  onCheckedChange={(checked) =>
                    onToggle?.(lesson.id, checked === true)
                  }
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
  lambId,
  chapterProgress,
  lifeProgress,
  canEdit,
}: GrowthProgressCardProps) {
  const updateLambInfo = useUpdateLambInfo();

  const completedCount = chapterProgress ?? 0;

  // lamb_lesson_life_progress นับต่อเนื่อง 0-36 คอลัมน์เดียว — แบ่งออกเป็น
  // ตอน 1 (1-18) และตอน 2 (19-36) ฝั่ง client (ดู grill-me 2026-08-13)
  const lifeCompletedCount = lifeProgress ?? 0;
  const part1CompletedCount = Math.min(lifeCompletedCount, 18);
  const part2CompletedCount = Math.max(lifeCompletedCount - 18, 0);

  // คลิกบทที่ N = เซ็ต progress เป็น N (ติ๊ก) หรือ N-1 (เอาติ๊กออก) — ตกลงใน
  // grill-me 2026-08-24 "ใช่ คลิกบท N = เซ็ต progress เป็น N"
  const handleChapterToggle = (lessonId: number, checked: boolean) => {
    updateLambInfo.mutate({
      id: lambId,
      values: {
        lamb_lesson_ch18_progress: checked ? lessonId : lessonId - 1,
      },
    });
  };

  // ตอน 1: local id N -> absolute 0-36 value เป็น N ตรงๆ
  const handleLifePart1Toggle = (lessonId: number, checked: boolean) => {
    updateLambInfo.mutate({
      id: lambId,
      values: {
        lamb_lesson_life_progress: checked ? lessonId : lessonId - 1,
      },
    });
  };

  // ตอน 2: local id N -> absolute value เป็น 18 + N (ตอน 1 ต้องจบแล้ว)
  const handleLifePart2Toggle = (lessonId: number, checked: boolean) => {
    updateLambInfo.mutate({
      id: lambId,
      values: {
        lamb_lesson_life_progress: checked ? 18 + lessonId : 18 + lessonId - 1,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress การเติบโต</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <LessonChecklist
          icon={<CircleCheckBig className="size-4 text-teal-600" />}
          title="พื้นฐานคริสเตียน"
          lessons={GROWTH_LESSONS}
          completedCount={completedCount}
          itemPrefix="บทที่"
          showBadge
          canEdit={canEdit}
          onToggle={handleChapterToggle}
        />

        <LessonChecklist
          icon={<CircleCheckBig className="size-4 text-teal-600" />}
          title="ลักษณะชีวิตคริสเตียน ตอน 1"
          lessons={CHRISTIAN_LIFE_LESSONS_PART1}
          completedCount={part1CompletedCount}
          itemPrefix="หัวข้อที่"
          canEdit={canEdit}
          onToggle={handleLifePart1Toggle}
        />

        <LessonChecklist
          icon={<CircleCheckBig className="size-4 text-teal-600" />}
          title="ลักษณะชีวิตคริสเตียน ตอน 2"
          lessons={CHRISTIAN_LIFE_LESSONS_PART2}
          completedCount={part2CompletedCount}
          itemPrefix="หัวข้อที่"
          canEdit={canEdit}
          onToggle={handleLifePart2Toggle}
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
