export type BibleBookMeta = {
  number: number;
  nameEn: string;
  nameTh: string;
  chapterCount: number;
};

// ระดับหัวข้อ ERV — 1 = หัวข้อหลัก (ตัวโตกว่า), 2 = หัวข้อย่อย/คำนำสดุดี/
// cross-reference (ตัวเล็กกว่า) ดู grill-me 2026-08-24 "แสดงต่างกัน"
export type BibleHeading = {
  level: 1 | 2;
  text: string;
};

// เชิงอรรถ ERV — marker คือตัวอักษรต่อเนื่องตลอดทั้งบท (a, b, c, ... z, aa, bb,
// ... เมื่อเกินตัวอักษร z) ผูกกับตำแหน่งฝัง {marker} ในเนื้อ
// ข้อความ (ดู lib/parse-footnotes.ts) — grill-me 2026-08-24
export type BibleFootnote = {
  marker: string;
  note: string;
};

export type BibleVerse = {
  verse: number;
  text: string;
  headings?: BibleHeading[];
  footnotes?: BibleFootnote[];
};

// ไฟล์ต่อเล่ม (ไม่ใช่ต่อบท) — ดู grill-me 2026-08-13: อยากได้ preprocess แยกเป็น
// ไฟล์ต่อบทเพื่อไม่โหลดทั้งเล่มพระคัมภีร์ทีเดียว (40MB) แต่ device_bash ใช้ไม่ได้
// ทั้ง session นี้ ทำให้ไม่มีทางรัน script บนเครื่องผู้ใช้เพื่อสร้าง/ส่งไฟล์เป็น
// พันๆ ไฟล์ผ่าน device bridge ได้ในทางปฏิบัติ (จำกัด 50 ไฟล์/ครั้ง) จึงปรับมา
// แยกเป็น "ต่อเล่ม" แทน (66 ไฟล์ x 2 ภาษา = 132 ไฟล์ ส่งได้จริง) แล้วให้ฝั่ง
// client fetch มาทั้งเล่ม (cache ไว้ด้วย react-query) แล้วค่อย slice เอาเฉพาะบท
// ที่ต้องการ — ขนาดไฟล์ต่อเล่มเล็กพอ (ใหญ่สุด ~750KB) ที่จะยังคง lazy-load ได้
// ตามเจตนารมณ์เดิม ไม่ใช่โหลดทั้ง 40MB ทุกครั้ง
export type BibleBookFile = {
  book_name: string;
  chapters: Record<string, BibleVerse[]>;
};

export type StrongsDictionaryEntry = {
  lemma: string;
  xlit?: string;
  translit?: string;
  pron?: string;
  derivation?: string;
  strongs_def: string;
  kjv_def?: string;
};

export type StrongsDictionary = Record<string, StrongsDictionaryEntry>;

export type BibleLanguageMode = "th" | "en" | "both";

// ฉบับแปลอังกฤษ — KJV (มีรหัส Strong's ฝังในเนื้อข้อความ) กับ NIV/ESV
// (ข้อความล้วน ไม่มีรหัส Strong's เพราะไฟล์ต้นทาง .SQLite3 ที่แปลงมาไม่มี
// ข้อมูลนี้) NIV เพิ่มเข้ามาทีหลัง (2026-08-21) ผู้ใช้อัปโหลดไฟล์
// NIV_en.SQLite3 มาเองแล้วขอให้ "ทำเหมือนกันเลย" กับ KJV — ดู data/queries.ts
// + public/bible/niv/*.json — esv เพิ่มมาอีกรอบ (2026-08-22) จาก
// ESV_en.SQLite3 ต้นฉบับมี markup red-letter/บทกวี/footnote (<J>/<t>/<pb/>/
// <f>) แต่ preprocess ตัดทิ้งหมดเหลือข้อความล้วนเหมือน niv ทุกประการ ตามที่
// ขอ "ทำเหมือนเดิม"
// erv เพิ่มมา (2026-08-24 "เพิ่ม ERV") จาก HTML ต้นฉบับ (engerv_html/) มี
// เชิงอรรถ (footnote) + หัวข้อ (heading 2 ระดับ) ฝังอยู่ ต่างจาก kjv/niv/esv
// ที่ไม่มีข้อมูลนี้ — ดู headings/footnotes ใน BibleVerse ด้านบน และ
// lib/parse-footnotes.ts
export type BibleEnglishVersion = "kjv" | "niv" | "esv" | "erv";

// ฉบับแปลไทย — เดิมมีแค่ฉบับเดียว (โฟลเดอร์ "thai" = ไทย KJV) ไม่มี selector
// เลย เพิ่ม erv เข้ามาคู่กัน (2026-08-24) จาก HTML ต้นฉบับ
// (html_THAERV/html/books/) — ไม่กระทบ URL เก่าที่แชร์ไว้ก่อนหน้า เพราะ
// undefined = "thai" (ค่าเริ่มต้นเดิม)
export type BibleThaiVersion = "thai" | "erv";
