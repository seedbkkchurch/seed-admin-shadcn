import { Fragment } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { parseStrongsText } from "../lib/parse-strongs";
import { StrongsWord } from "./strongs-word";
import { type BibleLanguageMode, type BibleVerse } from "../data/types";

type VerseBlockProps = {
  verseNumber: number;
  enText: string | undefined;
  thText: string | undefined;
  mode: BibleLanguageMode;
  showStrongs: boolean;
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
// รหัส Strong's แสดงเป็นข้อความธรรมดา ไม่มีขีดเส้นใต้ กดไม่ได้เลย
export function VerseBlock({
  verseNumber,
  enText,
  thText,
  mode,
  showStrongs,
  selectable,
  selected,
  onToggleSelect,
}: VerseBlockProps) {
  const showEn = mode === "en" || mode === "both";
  const showTh = mode === "th" || mode === "both";

  return (
    <div className="flex gap-2 py-1">
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
        {showEn && enText && (
          <p className="leading-relaxed">
            {parseStrongsText(enText).map((segment, i) => (
              <Fragment key={i}>
                {segment.type === "text" || !showStrongs ? (
                  segment.text
                ) : (
                  <StrongsWord text={segment.text} codes={segment.codes} />
                )}
              </Fragment>
            ))}
          </p>
        )}
        {showTh && thText && (
          <p
            className={
              mode === "both"
                ? "leading-relaxed text-muted-foreground"
                : "leading-relaxed"
            }
          >
            {thText}
          </p>
        )}
      </div>
    </div>
  );
}

export function versesToMap(verses: BibleVerse[] | undefined) {
  const map = new Map<number, string>();
  for (const v of verses ?? []) map.set(v.verse, v.text);
  return map;
}
