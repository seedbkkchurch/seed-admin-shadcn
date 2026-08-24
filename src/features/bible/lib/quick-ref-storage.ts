import { type BibleLanguageMode, type BibleVersion } from "../data/types";

const STORAGE_KEY = "bible-quick-ref-state-v1";

export type QuickRefState = {
  bookNumber: number;
  chapter: number;
  mode: BibleLanguageMode;
  showStrongs: boolean;
  version: BibleVersion;
};

const DEFAULT_STATE: QuickRefState = {
  bookNumber: 1,
  chapter: 1,
  mode: "both",
  showStrongs: true,
  version: "kjv",
};

const VALID_MODES: BibleLanguageMode[] = ["th", "en", "both"];
const VALID_VERSIONS: BibleVersion[] = ["kjv", "niv", "esv", "erv", "tcv", "tncv"];

// จำหนังสือ/บท/ภาษา/สวิตช์ Strong's/ฉบับล่าสุดที่เปิดค้างไว้ใน
// BibleQuickReferenceSheet (bottom sheet หน้าเขียนเฝ้าเดี่ยว) ข้ามวัน/ข้าม
// เครื่อง — คนละ state กับหน้า /bible เต็มจอที่ sync ลง URL อยู่แล้ว (ดู
// grill-me 2026-08-13 "เอา bible ไปใช้กับตอนเขียนเฝ้าเดี่ยว") เพิ่ม enVersion
// เข้ามาทีหลัง (2026-08-21) พร้อมฟีเจอร์ NIV แล้วเพิ่ม esv เข้า valid list
// อีกรอบ (2026-08-22) — เพิ่ม thVersion + erv เข้า valid list ของ enVersion
// อีกรอบ (2026-08-24 "เพิ่ม ERV") — รวม enVersion/thVersion เหลือ version
// เดียว (2026-08-24 รอบ 2 "เปลี่ยน กดเลือกภาษาก่อน แล้วจะแสดง dropdown
// bible") ไม่เก็บ backward-compat กับ key เดิม (ผู้ใช้ยืนยัน — ค่าเก่าที่
// เก็บไว้ใน localStorage เครื่องผู้ใช้จะแค่ถูกมองข้าม/ใช้ค่า default แทน)
export function loadQuickRefState(): QuickRefState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<QuickRefState>;
    return {
      bookNumber:
        typeof parsed.bookNumber === "number" && parsed.bookNumber >= 1
          ? parsed.bookNumber
          : DEFAULT_STATE.bookNumber,
      chapter:
        typeof parsed.chapter === "number" && parsed.chapter >= 1
          ? parsed.chapter
          : DEFAULT_STATE.chapter,
      mode:
        typeof parsed.mode === "string" &&
        VALID_MODES.includes(parsed.mode as BibleLanguageMode)
          ? (parsed.mode as BibleLanguageMode)
          : DEFAULT_STATE.mode,
      showStrongs:
        typeof parsed.showStrongs === "boolean"
          ? parsed.showStrongs
          : DEFAULT_STATE.showStrongs,
      version:
        typeof parsed.version === "string" &&
        VALID_VERSIONS.includes(parsed.version as BibleVersion)
          ? (parsed.version as BibleVersion)
          : DEFAULT_STATE.version,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveQuickRefState(state: QuickRefState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage เต็ม/ถูกบล็อก — ไม่ใช่เรื่องคอขาดบาดตาย เงียบไปเลย
  }
}
