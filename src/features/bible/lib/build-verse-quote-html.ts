import { parseStrongsText } from "./parse-strongs";
import { type BibleLanguageMode } from "../data/types";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// รวมเลขข้อที่เรียงต่อกันเป็นช่วง เช่น [16,17,18,20] -> "16-18, 20"
function formatVerseRange(sorted: number[]): string {
  if (sorted.length === 0) return "";
  const groups: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    groups.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = cur;
    prev = cur;
  }
  groups.push(start === prev ? `${start}` : `${start}-${prev}`);
  return groups.join(", ");
}

// ตัดรหัส Strong's ({H1234}/{G1234}/{(H8804)}) ออกจากข้อความอังกฤษ เหลือแต่
// เนื้อข้อความล้วนๆ สำหรับแทรกเข้า article editor (ไม่ต้องการวงเล็บปีกกา
// ปนอยู่ในบทความ)
function cleanEnglishVerseText(raw: string): string {
  return parseStrongsText(raw)
    .map((segment) => segment.text)
    .join("");
}

type BuildVerseQuoteHtmlParams = {
  bookNameTh: string;
  chapterNumber: number;
  verseNumbers: number[];
  mode: BibleLanguageMode;
  enVerses: Map<number, string>;
  thVerses: Map<number, string>;
};

// สร้าง HTML คำคม (blockquote) เดียวจากหลายข้อที่เลือกไว้พร้อมกัน — แต่ละข้อ
// ขึ้นบรรทัดใหม่ (ถ้าโหมด "ทั้งสองภาษา" จะมี 2 บรรทัดต่อข้อ อังกฤษก่อนไทย)
// ปิดท้ายด้วยอ้างอิงรวมบรรทัดเดียว เช่น "ยอห์น 3:16-18" (ดู grill-me
// 2026-08-13 "เอา bible ไปใช้กับตอนเขียนเฝ้าเดี่ยว")
export function buildVerseQuoteHtml({
  bookNameTh,
  chapterNumber,
  verseNumbers,
  mode,
  enVerses,
  thVerses,
}: BuildVerseQuoteHtmlParams): string {
  const sorted = [...verseNumbers].sort((a, b) => a - b);

  const lines: string[] = [];
  for (const v of sorted) {
    if (mode !== "th") {
      const raw = enVerses.get(v);
      if (raw) {
        lines.push(`<p>${v} ${escapeHtml(cleanEnglishVerseText(raw))}</p>`);
      }
    }
    if (mode !== "en") {
      const th = thVerses.get(v);
      if (th) {
        const prefix = mode === "both" ? "" : `${v} `;
        lines.push(`<p>${prefix}${escapeHtml(th)}</p>`);
      }
    }
  }

  const reference = `${bookNameTh} ${chapterNumber}:${formatVerseRange(sorted)}`;
  lines.push(`<p><em>${escapeHtml(reference)}</em></p>`);

  return `<blockquote>${lines.join("")}</blockquote>`;
}
