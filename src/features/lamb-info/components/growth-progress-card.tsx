import { useState } from "react";
import { CircleCheckBig, HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
// ต่อ ดู grill-me 2026-08-24, `attendance_mobile_layout`-adjacent memory
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
// The three checklists live in their own Tabs (grill-me 2026-08-25) so the
// card doesn't run too long — each TabsTrigger shows a "done/total" badge.
// Each tab has its own Check All / Uncheck All toggle button, hidden when
// canEdit is false. Because life part1/part2 share one continuous counter,
// "Check All" on part2 while part1 is incomplete jumps straight to 36
// (completes both), and "Uncheck All" on part1 while part2 already has
// progress warns via AlertDialog first (it would wipe part2's progress
// too, since it's the same counter) — see handleCheckAllLifePart1/2 below.
//
// The "ministry" section below still has no backing data on `lamb_info`
// (no role/start-date columns), so it stays as placeholder text, and lives
// outside the Tabs at the bottom of the card like before.
type GrowthProgressCardProps = {
  lambId: string;
  chapterProgress: number | null;
  lifeProgress: number | null;
  canEdit: boolean;
};

// Checklist บล็อกเดียว ใช้ซ้ำทั้ง 3 หลักสูตร (18 บท + ลักษณะชีวิตคริสเตียน 2
// ตอน) — ต่างกันแค่หัวข้อ label, prefix ของแต่ละรายการ, วิธีแปลง lesson id
// ที่ถูกคลิกให้เป็นค่า progress สัมบูรณ์ที่จะเซฟ (toProgressValue), และ
// พฤติกรรมของปุ่ม Check All/Uncheck All (onCheckAll)
type LessonChecklistProps = {
  lessons: GrowthLesson[];
  completedCount: number;
  itemPrefix: string;
  canEdit: boolean;
  isPending: boolean;
  onToggle: (lessonId: number, checked: boolean) => void;
  onCheckAll: () => void;
};

function LessonChecklist({
  lessons,
  completedCount,
  itemPrefix,
  canEdit,
  isPending,
  onToggle,
  onCheckAll,
}: LessonChecklistProps) {
  const allChecked = completedCount >= lessons.length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {canEdit
            ? "ข้อมูลจริงจากระบบ"
            : "ข้อมูลจริงจากระบบ — แก้ไขได้เฉพาะเจ้าของ/หัวหน้าแคร์/แอดมิน"}
        </span>
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={onCheckAll}
          >
            {allChecked ? "ยกเลิกติ๊กทั้งหมด" : "ติ๊กครบทั้งหมด"}
          </Button>
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
                  disabled={!canEdit || isPending}
                  onCheckedChange={(checked) =>
                    onToggle(lesson.id, checked === true)
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

// TabsTrigger สำหรับแต่ละหลักสูตร พร้อม badge "ทำแล้ว/ทั้งหมด" (grill-me
// 2026-08-25) เพื่อให้เห็นความคืบหน้าโดยไม่ต้องคลิกเข้าโปดู
function GrowthTabTrigger({
  value,
  icon,
  title,
  completedCount,
  total,
}: {
  value: string;
  icon: React.ReactNode;
  title: string;
  completedCount: number;
  total: number;
}) {
  return (
    <TabsTrigger value={value} className="flex-col gap-1 py-2 sm:flex-row sm:gap-2">
      <span className="flex items-center gap-1.5">
        {icon}
        {title}
      </span>
      <span className="text-xs text-muted-foreground data-[state=active]:text-current">
        {completedCount}/{total}
      </span>
    </TabsTrigger>
  );
}

export function GrowthProgressCard({
  lambId,
  chapterProgress,
  lifeProgress,
  canEdit,
}: GrowthProgressCardProps) {
  const updateLambInfo = useUpdateLambInfo();
  // ตามที่ตกลงกัน (grill-me 2026-08-25): disable ปุ่ม + checkbox ทั้งหมดใน
  // แท็บที่กำลังส่ง mutation อยู่ ระบุด้วย section ที่กำลัง pending
  const [pendingSection, setPendingSection] = useState<
    "chapter" | "part1" | "part2" | null
  >(null);
  // AlertDialog เตือนก่อน Uncheck All ตอน 1 ถ้าตอน 2 มีข้อมูลติ๊กไปแล้ว
  // (life part1/part2 ใช้ counter เดียวกัน — ล้างตอน 1 จะล้างตอน 2 ไปด้วย)
  const [confirmUncheckPart1Open, setConfirmUncheckPart1Open] = useState(false);

  const completedCount = chapterProgress ?? 0;

  // lamb_lesson_life_progress นับต่อเนื่อง 0-36 คอลัมน์เดียว — แบ่งออกเป็น
  // ตอน 1 (1-18) และตอน 2 (19-36) ฝั่ง client (ดู grill-me 2026-08-13)
  const lifeCompletedCount = lifeProgress ?? 0;
  const part1CompletedCount = Math.min(lifeCompletedCount, 18);
  const part2CompletedCount = Math.max(lifeCompletedCount - 18, 0);

  const saveLifeProgress = (value: number, section: "part1" | "part2") => {
    setPendingSection(section);
    updateLambInfo.mutate(
      { id: lambId, values: { lamb_lesson_life_progress: value } },
      { onSettled: () => setPendingSection(null) },
    );
  };

  // คลิกบทที่ N = เซ็ต progress เป็น N (ติ๊ก) หรือ N-1 (เอาติ๊กออก) — ตกลงใน
  // grill-me 2026-08-24 "ใช่ คลิกบท N = เซ็ต progress เป็น N"
  const handleChapterToggle = (lessonId: number, checked: boolean) => {
    setPendingSection("chapter");
    updateLambInfo.mutate(
      {
        id: lambId,
        values: {
          lamb_lesson_ch18_progress: checked ? lessonId : lessonId - 1,
        },
      },
      { onSettled: () => setPendingSection(null) },
    );
  };

  // ตอน 1: local id N -> absolute 0-36 value เป็น N ตรงๆ
  const handleLifePart1Toggle = (lessonId: number, checked: boolean) => {
    saveLifeProgress(checked ? lessonId : lessonId - 1, "part1");
  };

  // ตอน 2: local id N -> absolute value เป็น 18 + N (ตอน 1 ต้องจบแล้ว)
  const handleLifePart2Toggle = (lessonId: number, checked: boolean) => {
    saveLifeProgress(18 + (checked ? lessonId : lessonId - 1), "part2");
  };

  // Check All / Uncheck All — พื้นฐานคริสเตียน (คอลัมน์แยก ไม่กระทบใคร)
  const handleCheckAllChapter = () => {
    setPendingSection("chapter");
    updateLambInfo.mutate(
      {
        id: lambId,
        values: {
          lamb_lesson_ch18_progress:
            completedCount >= GROWTH_LESSONS.length ? 0 : GROWTH_LESSONS.length,
        },
      },
      { onSettled: () => setPendingSection(null) },
    );
  };

  // Check All / Uncheck All — ตอน 1: ถ้ากำลังจะ "ยกเลิกติ๊กทั้งหมด" และตอน 2
  // มีข้อมูลอยู่แล้ว ให้เตือนก่อน (grill-me 2026-08-25) เพราะจะล้างตอน 2 ไปด้วย
  const handleCheckAllLifePart1 = () => {
    const isFull = part1CompletedCount >= CHRISTIAN_LIFE_LESSONS_PART1.length;
    if (isFull) {
      if (part2CompletedCount > 0) {
        setConfirmUncheckPart1Open(true);
        return;
      }
      saveLifeProgress(0, "part1");
    } else {
      saveLifeProgress(CHRISTIAN_LIFE_LESSONS_PART1.length, "part1");
    }
  };

  const confirmUncheckAllPart1 = () => {
    setConfirmUncheckPart1Open(false);
    saveLifeProgress(0, "part1");
  };

  // Check All / Uncheck All — ตอน 2: "ติ๊กครบทั้งหมด" ทั้งที่ตอน 1 ยังไม่ครบ
  // จะเซ็ต progress = 36 ไปเลย (ครบทั้งตอน 1+2) — ตกลงใน grill-me 2026-08-25
  const handleCheckAllLifePart2 = () => {
    const isFull = part2CompletedCount >= CHRISTIAN_LIFE_LESSONS_PART2.length;
    saveLifeProgress(isFull ? 18 : 36, "part2");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress การเติบโต</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="chapter">
          <TabsList className="h-auto w-full sm:w-fit">
            <GrowthTabTrigger
              value="chapter"
              icon={<CircleCheckBig className="size-4 text-teal-600" />}
              title="พื้นฐานคริสเตียน"
              completedCount={completedCount}
              total={GROWTH_LESSONS.length}
            />
            <GrowthTabTrigger
              value="part1"
              icon={<CircleCheckBig className="size-4 text-teal-600" />}
              title="ลักษณะชีวิตคริสเตียน ตอน 1"
              completedCount={part1CompletedCount}
              total={CHRISTIAN_LIFE_LESSONS_PART1.length}
            />
            <GrowthTabTrigger
              value="part2"
              icon={<CircleCheckBig className="size-4 text-teal-600" />}
              title="ลักษณะชีวิตคริสเตียน ตอน 2"
              completedCount={part2CompletedCount}
              total={CHRISTIAN_LIFE_LESSONS_PART2.length}
            />
          </TabsList>

          <TabsContent value="chapter">
            <LessonChecklist
              lessons={GROWTH_LESSONS}
              completedCount={completedCount}
              itemPrefix="บทที่"
              canEdit={canEdit}
              isPending={pendingSection === "chapter"}
              onToggle={handleChapterToggle}
              onCheckAll={handleCheckAllChapter}
            />
          </TabsContent>

          <TabsContent value="part1">
            <LessonChecklist
              lessons={CHRISTIAN_LIFE_LESSONS_PART1}
              completedCount={part1CompletedCount}
              itemPrefix="หัวข้อที่"
              canEdit={canEdit}
              isPending={pendingSection === "part1"}
              onToggle={handleLifePart1Toggle}
              onCheckAll={handleCheckAllLifePart1}
            />
          </TabsContent>

          <TabsContent value="part2">
            <LessonChecklist
              lessons={CHRISTIAN_LIFE_LESSONS_PART2}
              completedCount={part2CompletedCount}
              itemPrefix="หัวข้อที่"
              canEdit={canEdit}
              isPending={pendingSection === "part2"}
              onToggle={handleLifePart2Toggle}
              onCheckAll={handleCheckAllLifePart2}
            />
          </TabsContent>
        </Tabs>

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

      <AlertDialog
        open={confirmUncheckPart1Open}
        onOpenChange={setConfirmUncheckPart1Open}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยกเลิกติ๊กทั้งหมดตอน 1?</AlertDialogTitle>
            <AlertDialogDescription>
              ตอน 1 (ลักษณะชีวิตคริสเตียน) และตอน 2 ใช้ตัวนับความคืบหน้าร่วมกัน
              การยกเลิกติ๊กทั้งหมดในตอน 1 (18 ข้อ) จะเอาติ๊กในตอน 2 ออกไปด้วย (
              {part2CompletedCount} ข้อ) รวมเป็น {part2CompletedCount + 18} ข้อ
              ต้องการดำเนินการต่อหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUncheckAllPart1}>
              ยกเลิกติ๊กทั้งหมด
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
