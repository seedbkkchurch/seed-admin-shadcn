import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type ChapterInputProps = {
  chapter: number;
  chapterCount: number;
  onChange: (chapter: number) => void;
  className?: string;
};

// ช่องกรอกเลขบทธรรมดาแทน Select เดิม — เล่มที่มีบทเยอะ (สดุดี 150 บท) เลื่อนหา
// ช้ากว่าพิมพ์เลขแล้ว Enter (ดู grill-me 2026-08-13) เกินขอบเขต → clamp
// อัตโนมัติ, พิมพ์ค่าที่ไม่ใช่ตัวเลข/เคลียร์ว่าง → คืนกลับเลขบทปัจจุบันเงียบๆ
export function ChapterInput({
  chapter,
  chapterCount,
  onChange,
  className,
}: ChapterInputProps) {
  const [draft, setDraft] = useState(String(chapter));

  // sync ค่าในช่องกลับเมื่อบทเปลี่ยนจากที่อื่น (เช่น เปลี่ยนหนังสือ, กด Enter
  // แล้ว clamp)
  useEffect(() => {
    setDraft(String(chapter));
  }, [chapter]);

  const commit = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || draft.trim() === "") {
      setDraft(String(chapter));
      return;
    }
    const clamped = Math.min(Math.max(Math.round(parsed), 1), chapterCount);
    if (clamped !== chapter) {
      onChange(clamped);
    } else {
      setDraft(String(chapter));
    }
  };

  return (
    <Input
      type="number"
      inputMode="numeric"
      min={1}
      max={chapterCount}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      onBlur={commit}
      className={cn("w-24", className)}
    />
  );
}
