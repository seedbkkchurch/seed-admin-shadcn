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
import { type BibleBookMeta, type BibleLanguageMode } from "../data/types";

type BibleNavProps = {
  books: BibleBookMeta[];
  bookNumber: number;
  chapter: number;
  mode: BibleLanguageMode;
  showStrongs: boolean;
  onBookChange: (bookNumber: number) => void;
  onChapterChange: (chapter: number) => void;
  onModeChange: (mode: BibleLanguageMode) => void;
  onShowStrongsChange: (show: boolean) => void;
};

// เลือกหนังสือ (combobox พิมพ์ค้นหา) + เลือกบท (พิมพ์เลขตรงๆ) + toggle ภาษา +
// สวิตช์เปิด/ปิดคำ Strong's ฮีบรู/กรีก (ดู grill-me 2026-08-13 — เดิมทั้งสอง
// ช่องเป็น Select แบบเลื่อนหา)
// มือถือ: stack เต็มความกว้างทีละแถว แทนที่จะ wrap เบียดกัน (ดู grill-me
// mobile-fit 2026-08-13)
export function BibleNav({
  books,
  bookNumber,
  chapter,
  mode,
  showStrongs,
  onBookChange,
  onChapterChange,
  onModeChange,
  onShowStrongsChange,
}: BibleNavProps) {
  const activeBook = books.find((b) => b.number === bookNumber);
  const chapterCount = activeBook?.chapterCount ?? 1;

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
          onValueChange={(v) => onModeChange(v as BibleLanguageMode)}
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

      {/* ปิดโหมดนี้ → คำที่มีรหัส Strong's กลายเป็นข้อความธรรมดา ไม่มีขีด
      เส้นใต้/hover/tap เลย (ดู grill-me 2026-08-13) */}
      <label className="flex items-center gap-2 text-sm sm:pb-2">
        <Switch checked={showStrongs} onCheckedChange={onShowStrongsChange} />
        แสดงคำศัพท์ Strong&apos;s (ฮีบรู/กรีก)
      </label>
    </div>
  );
}
