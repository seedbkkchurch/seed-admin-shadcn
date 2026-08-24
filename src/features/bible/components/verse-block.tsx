import { Checkbox } from "@/components/ui/checkbox";
import { BibleHeadings, BibleText, type BibleTextParseMode } from "./bible-text";
import { type BibleLanguageMode, type BibleVerse } from "../data/types";

type VerseBlockProps = {
  verseNumber: number;
  enVerse: BibleVerse | undefined;
  thVerse: BibleVerse | undefined;
  mode: BibleLanguageMode;
  showStrongs: boolean;
  enParseMode: BibleTextParseMode;
  thParseMode: BibleTextParseMode;
  // โหมดเลือกข้อ — ใช้เฉพาะตอนฝังใน BibleQuickReferenceSheet (หน้าเขียน
  // เฝ้าเดี่ยว) เพื่อติ๊กเลือกหลายข้อแล้วกด "แทรกข้อที่เลือก" ทีเดียว (ดู
  // grill-me 2026-08-13) — หน้า /bible เต็มจอไม่ส่ง prop นี้เลย จึงไม่มี
  // checkbox โผล่มา
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
};

// เรียงตามข้อ: อังกฤษก่อน ตามด้วยไทย เมื่อเลือกโหมด "ทั้งสองภาษา" (ดู grill-me
// 2026-08-13) — อังกฤษ parse หา Strong's markup, ไทยไม่มี markup แสดงตรงๆ
// showStrongs=false (โหมดปิด hover ฮีบรู/กรีก, grill-me 2026-08-13): คำที่มี
// รหัส Strong's แสดงเป็นข้อความธรรมดา ไม่มีขีดเส้นใต้ กดไม่ได้เลย — สวิตช์
// เดียวกันนี้ยังคุมเชิงอรรถ ERV ด้วย (ดู grill-me 2026-08-24 "ใช้สวิตช์
// เดียวกัน")
//
// หัวข้อ ERV (headings) — โชว์ครั้งเดียวก่อนข้อ ไม่ซ้ำสองภาษา: ใช้หัวข้อ
// ภาษาอังกฤษก่อนถ้าอังกฤษกำลังแสดงอยู่และมีหัวข้อ ไม่งั้นค่อย fallback ไปใช้
// หัวข้อภาษาไทย (เผื่อกรณีเลือก ERV ไทยคู่กับอังกฤษฉบับที่ไม่มีหัวข้อ เช่น
// KJV/NIV/ESV) — ดู grill-me 2026-08-24 "โชว์ครั้งเดียว (ภาษาอังกฤษ)"
export function VerseBlock({
  verseNumber,
  enVerse,
  thVerse,
  mode,
  showStrongs,
  enParseMode,
  thParseMode,
  selectable,
  selected,
  onToggleSelect,
}: VerseBlockProps) {
  const showEn = mode === "en" || mode === "both";
  const showTh = mode === "th" || mode === "both";

  const headings =
    showEn && enVerse?.headings?.length
      ? enVerse.headings
      : showTh && thVerse?.headings?.length
        ? thVerse.headings
        : undefined;

  return (
    <div className="py-1">
      <BibleHeadings headings={headings} />
      <div className="flex gap-2">
        {selectable ? (
          <button
            type="button"
            onClick={onToggleSelect}
            className="mt-0.5 flex shrink-0 items-center gap-1.5"
          >
            <Checkbox
              checked={!!selected}
              onCheckedChange={onToggleSelect}
              className="pointer-events-none"
            />
            <span className="text-xs font-medium text-muted-foreground">
              {verseNumber}
            </span>
          </button>
        ) : (
          <span className="mt-0.5 shrink-0 text-xs font-medium text-muted-foreground">
            {verseNumber}
          </span>
        )}
        <div className="flex-1 space-y-1">
          {showEn && enVerse?.text && (
            <p className="leading-relaxed">
              <BibleText
                text={enVerse.text}
                parseMode={enParseMode}
                showMarkup={showStrongs}
                footnotes={enVerse.footnotes}
              />
            </p>
          )}
          {showTh && thVerse?.text && (
            <p
              className={
                mode === "both"
                  ? "leading-relaxed text-muted-foreground"
                  : "leading-relaxed"
              }
            >
              <BibleText
                text={thVerse.text}
                parseMode={thParseMode}
                showMarkup={showStrongs}
                footnotes={thVerse.footnotes}
              />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function indexVerses(
  verses: BibleVerse[] | undefined,
): Map<number, BibleVerse> {
  const map = new Map<number, BibleVerse>();
  for (const v of verses ?? []) map.set(v.verse, v);
  return map;
}
