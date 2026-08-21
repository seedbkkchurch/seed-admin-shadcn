import {
  DEFAULT_FONT_SIZE_STEP_INDEX,
  LATIN_READING_FONTS,
  READING_FONT_SIZE_STEPS,
  THAI_READING_FONTS,
} from "./reading-mode-fonts";

const STORAGE_KEY = "bible-reading-mode-settings-v1";

export type ReadingModeSettings = {
  fontSizeStepIndex: number;
  thaiFontId: string;
  latinFontId: string;
};

const DEFAULT_SETTINGS: ReadingModeSettings = {
  fontSizeStepIndex: DEFAULT_FONT_SIZE_STEP_INDEX,
  thaiFontId: THAI_READING_FONTS[0].id,
  latinFontId: LATIN_READING_FONTS[0].id,
};

// จำขนาดตัวอักษร + ฟอนต์ไทย/อังกฤษที่เลือกไว้ใน reading mode ข้ามวัน/ข้าม
// เครื่อง — key เดียวกันใช้ร่วมทั้งหน้า /bible เต็มจอ และ bottom sheet เขียน
// เฝ้าเดี่ยว ("localStorage กลาง" ตามที่ตกลงไว้ใน grill-me 2026-08-21) แต่ไม่
// จำสถานะเปิด/ปิด reading mode เอง (เข้าหน้าใหม่เริ่มที่โหมดปกติเสมอ)
export function loadReadingModeSettings(): ReadingModeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ReadingModeSettings>;
    return {
      fontSizeStepIndex:
        typeof parsed.fontSizeStepIndex === "number" &&
        parsed.fontSizeStepIndex >= 0 &&
        parsed.fontSizeStepIndex < READING_FONT_SIZE_STEPS.length
          ? parsed.fontSizeStepIndex
          : DEFAULT_SETTINGS.fontSizeStepIndex,
      thaiFontId:
        typeof parsed.thaiFontId === "string" &&
        THAI_READING_FONTS.some((f) => f.id === parsed.thaiFontId)
          ? parsed.thaiFontId
          : DEFAULT_SETTINGS.thaiFontId,
      latinFontId:
        typeof parsed.latinFontId === "string" &&
        LATIN_READING_FONTS.some((f) => f.id === parsed.latinFontId)
          ? parsed.latinFontId
          : DEFAULT_SETTINGS.latinFontId,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveReadingModeSettings(settings: ReadingModeSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage เต็ม/ถูกบล็อก — เงียบไปเลยเหมือน quick-ref-storage.ts
  }
}
