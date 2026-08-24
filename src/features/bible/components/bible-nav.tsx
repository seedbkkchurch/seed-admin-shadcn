import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BookCombobox } from "./book-combobox";
import { ChapterInput } from "./chapter-input";
import {
  resolveVersionForMode,
  VERSION_LABELS,
  versionsForMode,
} from "../lib/bible-versions";
import { type BibleBookMeta, type BibleLanguageMode, type BibleVersion } from "../data/types";

type BibleNavProps = {
  books: BibleBookMeta[];
  bookNumber: number;
  chapter: number;
  mode: BibleLanguageMode;
  showStrongs: boolean;
  version: BibleVersion;
  onBookChange: (bookNumber: number) => void;
  onChapterChange: (chapter: number) => void;
  onModeChange: (mode: BibleLanguageMode) => void;
  onShowStrongsChange: (show: boolean) => void;
  onVersionChange: (version: BibleVersion) => void;
};

// เลือกหนังสือ (combobox พิมพ์ค้นหา) + เลือกบท (พิมพ์เลขตรงๆ) + toggle ภาษา
// (เลือกก่อน) + dropdown "ฉบับ" เดียว (กรองตามภาษาที่เลือกไว้) + สวิตช์
// เปิด/ปิดคำ Strong's ฮีบรู/กรีก + เชิงอรรถ ERV (ดู grill-me 2026-08-13 —
// เดิมทั้งสองช่องเป็น Select แบบเลื่อนหา) — เดิม (2026-08-21..24) แยกเป็น
// "ฉบับอังกฤษ"/"ฉบับไทย" สอง dropdown เลือกผสมข้ามฉบับกันได้ ผู้ใช้ขอ
// เปลี่ยนใหม่ (grill-me 2026-08-24 รอบ 2 "เปลี่ยน กดเลือกภาษาก่อน แล้วจะ
// แสดง dropdown bible ไม่ต้องมีแยกฉบับไทยฉบับอังกฤษ") — ตอนนี้ "ภาษา" มาก่อน
// เสมอ (โชว์ครบ 3 ตัวเลือกตลอด ไม่ถูกซ่อนตามฉบับแบบเดิมอีกแล้ว) แล้ว dropdown
// "ฉบับ" กรองเหลือเฉพาะชุดที่รองรับภาษานั้นๆ (kjv/erv มีไทย, niv/esv มีแต่
// อังกฤษ) — เปลี่ยนภาษาแล้วฉบับเดิมใช้ไม่ได้ (เช่น NIV ตอนสลับไปเป็น "ทั้ง
// สองภาษา") จะเด้งกลับไป KJV อัตโนมัติ (ดู lib/bible-versions.ts)
// มือถือ: stack เต็มความกว้างทีละแถว แทนที่จะ wrap เบียดกัน (ดู grill-me
// mobile-fit 2026-08-13)
export function BibleNav({
  books,
  bookNumber,
  chapter,
  mode,
  showStrongs,
  version,
  onBookChange,
  onChapterChange,
  onModeChange,
  onShowStrongsChange,
  onVersionChange,
}: BibleNavProps) {
  const activeBook = books.find((b) => b.number === bookNumber);
  const chapterCount = activeBook?.chapterCount ?? 1;
  const availableVersions = versionsForMode(mode);

  const handleModeChange = (nextMode: BibleLanguageMode) => {
    onModeChange(nextMode);
    const nextVersion = resolveVersionForMode(version, nextMode);
    if (nextVersion !== version) onVersionChange(nextVersion);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">หนังสือ</span>
        <BookCombobox
          books={books}
          bookNumber={bookNumber}
          onChange={onBookChange}
          className="w-full sm:w-56"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">บท (1-{chapterCount})</span>
        <ChapterInput
          chapter={chapter}
          chapterCount={chapterCount}
          onChange={onChapterChange}
          className="w-full sm:w-24"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">ภาษา</span>
        <Select
          value={mode}
          onValueChange={(v) => handleModeChange(v as BibleLanguageMode)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">ไทย + อังกฤษ</SelectItem>
            <SelectItem value="th">ไทยอย่างเดียว</SelectItem>
            <SelectItem value="en">อังกฤษอย่างเดียว</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">ฉบับ</span>
        <Select
          value={version}
          onValueChange={(v) => onVersionChange(v as BibleVersion)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableVersions.map((v) => (
              <SelectItem key={v} value={v}>
                {VERSION_LABELS[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ปิดโหมดนี้ → คำที่มีรหัส Strong's กลายเป็นข้อความธรรมดา ไม่มีขีด
      เส้นใต้/hover/tap เลย, เครื่องหมายเชิงอรรถ ERV ก็หายไปด้วย (ดู grill-me
      2026-08-13, 2026-08-24 "ใช้สวิตช์เดียวกันคุมทั้ง Strong's และ
      footnote") — เลือกฉบับที่ไม่มี Strong's หรือเชิงอรรถแล้วสวิตช์นี้ไม่มี
      ผลอะไรอยู่แล้ว แต่ปล่อยให้กดได้เฉยๆ ไม่ต้องซ่อน กันงงว่าทำไมหายไปเวลา
      สลับฉบับไปมา */}
      <label className="flex items-center gap-2 text-sm sm:pb-2">
        <Switch checked={showStrongs} onCheckedChange={onShowStrongsChange} />
        แสดงคำศัพท์ Strong&apos;s / เชิงอรรถ
      </label>
    </div>
  );
}
