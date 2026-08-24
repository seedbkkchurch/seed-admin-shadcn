import { parseStrongsText } from "./parse-strongs";
import { stripFootnoteMarkers } from "./parse-footnotes";
import { type BibleLanguageMode, type BibleVerse } from "../data/types";

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

// ตัด marker เชิงอรรถ ERV ({marker}) ออกด้วย — ไม่ว่าอังกฤษหรือไทย เหลือแต่
// เนื้อข้อความล้วน ไม่มี note ติดมาด้วยเลย (headings ไม่ต้องตัดเพราะไม่เคยถูก
// ใส่ลงในคำคมตั้งแต่แรก — ฟังก์ชันนี้อ่านแค่ field .text) ดู grill-me
// 2026-08-24 "ตัดออกทั้งหมด เหลือแค่เนื้อข้อความข้อล้วน (เหมือน Strong's เดิม)"
function cleanQuoteText(raw: string): string {
  return stripFootnoteMarkers(raw);
}

type BuildVerseQuoteHtmlParams = {
  bookNameTh: string;
  chapterNumber: number;
  verseNumbers: number[];
  mode: BibleLanguageMode;
  enVerses: Map<number, BibleVerse>;
  thVerses: Map<number, BibleVerse>;
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
      const raw = enVerses.get(v)?.text;
      if (raw) {
        const clean = cleanEnglishVerseText(cleanQuoteText(raw));
        lines.push(`<p>${v} ${escapeHtml(clean)}</p>`);
      }
    }
    if (mode !== "en") {
      const th = thVerses.get(v)?.text;
      if (th) {
        const clean = cleanQuoteText(th);
        const prefix = mode === "both" ? "" : `${v} `;
        lines.push(`<p>${prefix}${escapeHtml(clean)}</p>`);
      }
    }
  }

  const reference = `${bookNameTh} ${chapterNumber}:${formatVerseRange(sorted)}`;
  lines.push(`<p><em>${escapeHtml(reference)}</em></p>`);

  return `<blockquote>${lines.join("")}</blockquote>`;
}
