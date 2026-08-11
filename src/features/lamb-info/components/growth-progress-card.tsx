import { CircleCheckBig, HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { GROWTH_LESSONS } from "../data/lessons";

// Driven by `lamb_info.lamb_lesson_ch18_progress` (a count of chapters
// completed, e.g. 7 means chapters 1-7 are done) — read-only for now.
// Checkboxes are disabled: there's no mutation/save path yet, only
// display. See lamb-info-action-dialog.tsx if/when editing this value is
// wired in.
//
// The "ministry" section below still has no backing data on `lamb_info`
// (no role/start-date columns), so it stays as placeholder text.
type GrowthProgressCardProps = {
  chapterProgress: number | null;
};

export function GrowthProgressCard({
  chapterProgress,
}: GrowthProgressCardProps) {
  const completedCount = chapterProgress ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress การเติบโต</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium">
              <CircleCheckBig className="size-4 text-teal-600" />
              บทเรียนที่ศึกษาแล้ว
            </div>
            <span className="text-xs text-muted-foreground">
              ข้อมูลจริงจากระบบ — แก้ไขยังไม่ได้ตอนนี้
            </span>
          </div>
          <div className="rounded-lg bg-teal-50/60 p-4 dark:bg-teal-950/20">
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {GROWTH_LESSONS.map((lesson) => {
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
                      บทที่ {lesson.id}: {lesson.title}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

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
