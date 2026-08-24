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
// ... เมื่อเกินตัวอักษร z) ผูกกับตำแหน่งฝัง {marker} ในเนื้อ
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

// ฉบับพระคัมภีร์ — เดิมแยก "ฉบับอังกฤษ"/"ฉบับไทย" เป็นสอง dropdown เลือกผสม
// ข้ามฉบับกันได้ (เช่น อังกฤษ NIV + ไทย ERV) ผู้ใช้ขอเปลี่ยน (grill-me
// 2026-08-24 รอบ 2 "เปลี่ยน กดเลือกภาษาก่อน แล้วจะแสดง dropdown bible")
// ให้เหลือ "ชุดฉบับ" เดียว ตายตัวว่าแต่ละชุดรองรับภาษาไหนบ้าง — KJV/ERV มี
// ทั้งไทย+อังกฤษ (คนละไฟล์ต่อภาษาแต่จับคู่กันเป็นฉบับเดียว), NIV/ESV มีแค่
// อังกฤษ, TCV มีแค่ไทย (เพิ่มมารอบ 3 2026-08-24 "เพิ่ม TCV" — Thai Common
// Version 2025 จาก USX ต้นฉบับที่ผู้ใช้อัปโหลด ไม่มีคู่ภาษาอังกฤษเลย) TNCV
// เพิ่มมารอบ 6 (2026-08-24 "เพิ่ม TNCV") ก็มีแค่ไทยเหมือนกัน — Biblica Open
// Thai New Contemporary Version 2007 คนละคลังข้อมูล/คนละไฟล์กับ TCV โดย
// สิ้นเชิง — dropdown ฉบับจะกรองตามโหมดภาษาที่เลือกไว้ก่อน (ดู
// lib/bible-versions.ts: versionsForMode/resolveVersionForMode) ไม่มีทาง
// เลือกผสมข้ามฉบับแบบเดิมได้อีกแล้ว
export type BibleVersion = "kjv" | "niv" | "esv" | "erv" | "tcv" | "tncv";
