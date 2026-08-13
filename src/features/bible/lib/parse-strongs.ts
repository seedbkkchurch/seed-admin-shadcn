// อังกฤษ KJV+Strongs ฝัง markup แบบ `word{H1234}` (รหัส Strong's จริง ต่อท้ายคำ
// แบบไม่มีช่องว่าง) และ `{(H8804)}` (รหัสไวยากรณ์/Tense-Voice-Mood — ไม่ใช่
// entry ใน dictionary ห้ามลิงก์) — คำเดียวอาจมีหลายรหัสต่อกัน เช่น
// `created{H1254}{(H8804)}{H853}` → "created" ผูกกับ H1254 และ H853 เท่านั้น
// (ดู grill-me 2026-08-13: ขีดเส้นใต้จางๆ ไม่โชว์เลขรหัส)
export type BibleTextSegment =
  | { type: "text"; text: string }
  | { type: "word"; text: string; codes: string[] };

const TAG_SPLIT_RE = /(\{[^}]*\})/g;
const REAL_CODE_RE = /^\{([HG]\d+)\}$/;

export function parseStrongsText(raw: string): BibleTextSegment[] {
  const parts = raw.split(TAG_SPLIT_RE).filter((p) => p !== "");
  const segments: BibleTextSegment[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith("{")) continue; // tags are consumed via lookahead below

    // มองไปข้างหน้า เก็บรหัสทั้งหมดที่ตามหลังคำนี้ติดกัน (ไม่มีช่องว่างคั่น)
    const codes: string[] = [];
    let j = i + 1;
    while (j < parts.length && parts[j].startsWith("{")) {
      const match = REAL_CODE_RE.exec(parts[j]);
      if (match) codes.push(match[1]);
      j++;
    }

    if (codes.length === 0) {
      segments.push({ type: "text", text: part });
      continue;
    }

    // แยกคำสุดท้าย (ที่รหัสผูกอยู่) ออกจากข้อความก่อนหน้า
    const match = /^(.*?)(\S+)$/s.exec(part);
    if (match) {
      if (match[1]) segments.push({ type: "text", text: match[1] });
      segments.push({ type: "word", text: match[2], codes });
    } else {
      segments.push({ type: "word", text: part, codes });
    }
  }

  return segments;
}
