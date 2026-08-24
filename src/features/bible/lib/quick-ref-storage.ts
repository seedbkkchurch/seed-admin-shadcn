import {
  type BibleEnglishVersion,
  type BibleLanguageMode,
  type BibleThaiVersion,
} from "../data/types";

const STORAGE_KEY = "bible-quick-ref-state-v1";

export type QuickRefState = {
  bookNumber: number;
  chapter: number;
  mode: BibleLanguageMode;
  showStrongs: boolean;
  enVersion: BibleEnglishVersion;
  thVersion: BibleThaiVersion;
};

const DEFAULT_STATE: QuickRefState = {
  bookNumber: 1,
  chapter: 1,
  mode: "both",
  showStrongs: true,
  enVersion: "kjv",
  thVersion: "thai",
};

const VALID_MODES: BibleLanguageMode[] = ["th", "en", "both"];
const VALID_EN_VERSIONS: BibleEnglishVersion[] = ["kjv", "niv", "esv", "erv"];
const VALID_TH_VERSIONS: BibleThaiVersion[] = ["thai", "erv"];

// จำหนังสือ/บท/ภาษา/สวิตช์ Strong's/ฉบับแปลอังกฤษ+ไทยล่าสุดที่เปิดค้างไว้ใน
// BibleQuickReferenceSheet (bottom sheet หน้าเขียนเฝ้าเดี่ยว) ข้ามวัน/ข้าม
// เครื่อง — คนละ state กับหน้า /bible เต็มจอที่ sync ลง URL อยู่แล้ว (ดู
// grill-me 2026-08-13 "เอา bible ไปใช้กับตอนเขียนเฝ้าเดี่ยว") เพิ่ม enVersion
// เข้ามาทีหลัง (2026-08-21) พร้อมฟีเจอร์ NIV แล้วเพิ่ม esv เข้า valid list
// อีกรอบ (2026-08-22) — เพิ่ม thVersion + erv เข้า valid list ของ enVersion
// อีกรอบ (2026-08-24 "เพิ่ม ERV")
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
      enVersion:
        typeof parsed.enVersion === "string" &&
        VALID_EN_VERSIONS.includes(parsed.enVersion as BibleEnglishVersion)
          ? (parsed.enVersion as BibleEnglishVersion)
          : DEFAULT_STATE.enVersion,
      thVersion:
        typeof parsed.thVersion === "string" &&
        VALID_TH_VERSIONS.includes(parsed.thVersion as BibleThaiVersion)
          ? (parsed.thVersion as BibleThaiVersion)
          : DEFAULT_STATE.thVersion,
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
