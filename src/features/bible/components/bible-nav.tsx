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
  type BibleBookMeta,
  type BibleEnglishVersion,
  type BibleLanguageMode,
  type BibleThaiVersion,
} from "../data/types";

type BibleNavProps = {
  books: BibleBookMeta[];
  bookNumber: number;
  chapter: number;
  mode: BibleLanguageMode;
  showStrongs: boolean;
  enVersion: BibleEnglishVersion;
  thVersion: BibleThaiVersion;
  onBookChange: (bookNumber: number) => void;
  onChapterChange: (chapter: number) => void;
  onModeChange: (mode: BibleLanguageMode) => void;
  onShowStrongsChange: (show: boolean) => void;
  onEnVersionChange: (version: BibleEnglishVersion) => void;
  onThVersionChange: (version: BibleThaiVersion) => void;
};

// เลือกหนังสือ (combobox พิมพ์ค้นหา) + เลือกบท (พิมพ์เลขตรงๆ) + toggle ภาษา +
// เลือกฉบับแปลอังกฤษ (KJV/NIV/ESV/ERV) + เลือกฉบับแปลไทย (ไทย/ERV) + สวิตช์
// เปิด/ปิดคำ Strong's ฮีบรู/กรีก + เชิงอรรถ ERV (ดู grill-me 2026-08-13 —
// เดิมทั้งสองช่องเป็น Select แบบเลื่อนหา) ฉบับแปลอังกฤษเพิ่มมาทีหลัง
// (2026-08-21 "เพิ่ม NIV", 2026-08-22 "เพิ่ม ESV") ฉบับแปลไทย + erv อังกฤษ
// เพิ่มมาอีกรอบ (2026-08-24 "เพิ่ม ERV") — dropdown ฉบับไทยจับคู่กับฉบับ
// อังกฤษเหมือนกัน โชว์เฉพาะตอนโหมดภาษามีไทย (th/both) ส่วนฉบับอังกฤษโชว์เฉพาะ
// ตอนโหมดภาษามีอังกฤษ (en/both) เพราะเลือกไปก็ไม่มีผลถ้าไม่ได้แสดงภาษานั้น —
// สวิตช์ Strong's/เชิงอรรถ ก็ปิดใช้งาน (ไม่ซ่อน) ตอนเลือกฉบับที่ไม่มีข้อมูลนี้
// เพราะไฟล์นั้นไม่มีรหัส/เชิงอรรถฝังอยู่
// มือถือ: stack เต็มความกว้างทีละแถว แทนที่จะ wrap เบียดกัน (ดู grill-me
// mobile-fit 2026-08-13)
export function BibleNav({
  books,
  bookNumber,
  chapter,
  mode,
  showStrongs,
  enVersion,
  thVersion,
  onBookChange,
  onChapterChange,
  onModeChange,
  onShowStrongsChange,
  onEnVersionChange,
  onThVersionChange,
}: BibleNavProps) {
  const activeBook = books.find((b) => b.number === bookNumber);
  const chapterCount = activeBook?.chapterCount ?? 1;
  const showEnVersionPicker = mode !== "th";
  const showThVersionPicker = mode !== "en";

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
            {/* NIV/ESV เป็นอังกฤษล้วน ไม่มีไฟล์ไทยให้โชว์คู่ — ซ่อนตัวเลือกที่
            มีไทยออกเมื่อเลือก NIV/ESV เหลือแค่ "อังกฤษอย่างเดียว" ให้เลือก
            (ดู grill-me 2026-08-21 "ถ้า NIV มีแค่ภาษาอังกฤษ ให้แสดง dropdown
            แค่ภาษาอังกฤษ" — esv เพิ่มมา 2026-08-22 ทำเหมือนกัน — ERV คงเดิม
            พฤติกรรมนี้ไว้ 2026-08-24 "คงพฤติกรรมเดิม" เพราะ ERV มีไฟล์ไทยของ
            ตัวเองอยู่แล้ว ไม่ได้ผูกกับ enVersion) */}
            {enVersion !== "niv" && enVersion !== "esv" && (
              <SelectItem value="both">ไทย + อังกฤษ</SelectItem>
            )}
            {enVersion !== "niv" && enVersion !== "esv" && (
              <SelectItem value="th">ไทยอย่างเดียว</SelectItem>
            )}
            <SelectItem value="en">อังกฤษอย่างเดียว</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showThVersionPicker && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">ฉบับไทย</span>
          <Select
            value={thVersion}
            onValueChange={(v) => onThVersionChange(v as BibleThaiVersion)}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thai">KJV</SelectItem>
              <SelectItem value="erv">ERV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {showEnVersionPicker && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">ฉบับอังกฤษ</span>
          <Select
            value={enVersion}
            onValueChange={(v) => onEnVersionChange(v as BibleEnglishVersion)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kjv">KJV (มี Strong&apos;s)</SelectItem>
              <SelectItem value="niv">NIV</SelectItem>
              <SelectItem value="esv">ESV</SelectItem>
              <SelectItem value="erv">ERV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ปิดโหมดนี้ → คำที่มีรหัส Strong's กลายเป็นข้อความธรรมดา ไม่มีขีด
      เส้นใต้/hover/tap เลย, เครื่องหมายเชิงอรรถ ERV ก็หายไปด้วย (ดู grill-me
      2026-08-13, 2026-08-24 "ใช้สวิตช์เดียวกันคุมทั้ง Strong's และ
      footnote") — เลือก NIV/ESV/ฉบับที่ไม่มี Strong's หรือเชิงอรรถแล้วสวิตช์
      นี้ไม่มีผลอะไรอยู่แล้ว แต่ปล่อยให้กดได้เฉยๆ ไม่ต้องซ่อน กันงงว่าทำไม
      หายไปเวลาสลับฉบับไปมา */}
      <label className="flex items-center gap-2 text-sm sm:pb-2">
        <Switch checked={showStrongs} onCheckedChange={onShowStrongsChange} />
        แสดงคำศัพท์ Strong&apos;s / เชิงอรรถ
      </label>
    </div>
  );
}
