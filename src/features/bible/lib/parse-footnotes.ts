import { type BibleFootnote } from "../data/types";

// ERV ฝัง marker เชิงอรรถในเนื้อข้อความด้วยตัวอักษร private-use-area คั่นหน้า-
// หลัง (ดู /tmp/erv_parse.py ตอน preprocess) แทนที่จะใช้ markup แบบ {H1234}
// เหมือน Strong's เพราะตัว marker เอง (a, b, aa, bb, ...) เป็นตัวอักษรธรรมดา
// ที่อาจปนกับเนื้อข้อความจริงได้ ใช้ตัวอักษรที่ไม่มีทางพิมพ์ปนมาจากแหล่งข้อมูล
// จริงแทน — ดู grill-me 2026-08-24
const FN_START = "\ue000";
const FN_END = "\ue001";
const FN_RE = new RegExp(`${FN_START}([^${FN_END}]*)${FN_END}`, "g");

// ใช้ตัดออกตอนสร้างคำคมแทรก editor (build-verse-quote-html.ts) — ไม่ต้องรู้
// จักเนื้อหา note เลย ตัดทั้งก้อน marker ทิ้งให้เหลือแต่ข้อความล้วน (ดู
// grill-me 2026-08-24 "ตัดออกทั้งหมด")
export function stripFootnoteMarkers(text: string): string {
  return text.replace(FN_RE, "");
}

export type BibleFootnoteTextSegment =
  | { type: "text"; text: string }
  | { type: "footnote"; marker: string; note: string };

export function parseFootnoteText(
  raw: string,
  footnotes: BibleFootnote[] | undefined,
): BibleFootnoteTextSegment[] {
  const noteByMarker = new Map((footnotes ?? []).map((f) => [f.marker, f.note]));
  const segments: BibleFootnoteTextSegment[] = [];
  let lastIndex = 0;
  FN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FN_RE.exec(raw))) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", text: raw.slice(lastIndex, match.index) });
    }
    const marker = match[1];
    segments.push({
      type: "footnote",
      marker,
      note: noteByMarker.get(marker) ?? "",
    });
    lastIndex = FN_RE.lastIndex;
  }
  if (lastIndex < raw.length) {
    segments.push({ type: "text", text: raw.slice(lastIndex) });
  }
  return segments;
}
