import { type BibleLanguageMode } from "../data/types";

const STORAGE_KEY = "bible-quick-ref-state-v1";

export type QuickRefState = {
  bookNumber: number;
  chapter: number;
  mode: BibleLanguageMode;
  showStrongs: boolean;
};

const DEFAULT_STATE: QuickRefState = {
  bookNumber: 1,
  chapter: 1,
  mode: "both",
  showStrongs: true,
};

const VALID_MODES: BibleLanguageMode[] = ["th", "en", "both"];

// จำหนังสือ/บท/ภาษา/สวิตช์ Strong's ล่าสุดที่เปิดค้างไว้ใน
// BibleQuickReferenceSheet (bottom sheet หน้าเขียนเฝ้าเดี่ยว) ข้ามวัน/ข้าม
// เครื่อง — คนละ state กับหน้า /bible เต็มจอที่ sync ลง URL อยู่แล้ว (ดู
// grill-me 2026-08-13 "เอา bible ไปใช้กับตอนเขียนเฝ้าเดี่ยว")
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
