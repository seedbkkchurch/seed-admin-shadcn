export type BibleBookMeta = {
  number: number;
  nameEn: string;
  nameTh: string;
  chapterCount: number;
};

export type BibleVerse = {
  verse: number;
  text: string;
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
export type BibleEnglishVersion = "kjv" | "niv" | "esv";
