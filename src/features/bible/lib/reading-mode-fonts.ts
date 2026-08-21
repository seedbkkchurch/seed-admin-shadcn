// รายชื่อ Google Fonts ให้เลือกใน reading mode — แยกชุดไทย/อังกฤษเพราะ Google
// Fonts ส่วนใหญ่ไม่มี glyph ภาษาไทย (ดู grill-me 2026-08-21) จำกัดเป็นรายการ
// คัดมาแล้วแทนให้พิมพ์ค้นหาเอง เพราะฟอนต์ไทยที่ครอบคลุมจริงมีไม่กี่ตัว
// ตัวแรกของแต่ละรายการ = ค่าเริ่มต้น (ไม่ใช้ font เดิมของแอปเป็นค่าเริ่มต้น —
// เลือก Sarabun/Inter ไปเลยตามที่คุยกันไว้)
export type ReadingFontOption = {
  id: string;
  label: string;
  cssFamily: string;
  googleFamilyParam: string;
};

export const THAI_READING_FONTS: ReadingFontOption[] = [
  {
    id: "sarabun",
    label: "Sarabun",
    cssFamily: "'Sarabun', sans-serif",
    googleFamilyParam: "Sarabun:wght@400;500;600;700",
  },
  {
    id: "ibm-plex-thai-looped",
    label: "IBM Plex Sans Thai Looped",
    cssFamily: "'IBM Plex Sans Thai Looped', sans-serif",
    googleFamilyParam: "IBM+Plex+Sans+Thai+Looped:wght@400;500;600;700",
  },
  {
    id: "noto-sans-thai",
    label: "Noto Sans Thai",
    cssFamily: "'Noto Sans Thai', sans-serif",
    googleFamilyParam: "Noto+Sans+Thai:wght@400;500;600;700",
  },
  {
    id: "mitr",
    label: "Mitr",
    cssFamily: "'Mitr', sans-serif",
    googleFamilyParam: "Mitr:wght@400;500;600;700",
  },
  {
    id: "kanit",
    label: "Kanit",
    cssFamily: "'Kanit', sans-serif",
    googleFamilyParam: "Kanit:wght@400;500;600;700",
  },
  {
    id: "chonburi",
    label: "Chonburi",
    cssFamily: "'Chonburi', cursive",
    googleFamilyParam: "Chonburi",
  },
];

export const LATIN_READING_FONTS: ReadingFontOption[] = [
  {
    id: "inter",
    label: "Inter",
    cssFamily: "'Inter', sans-serif",
    googleFamilyParam: "Inter:wght@400;500;600;700",
  },
  {
    id: "lora",
    label: "Lora",
    cssFamily: "'Lora', serif",
    googleFamilyParam: "Lora:wght@400;500;600;700",
  },
  {
    id: "merriweather",
    label: "Merriweather",
    cssFamily: "'Merriweather', serif",
    googleFamilyParam: "Merriweather:wght@400;700",
  },
  {
    id: "eb-garamond",
    label: "EB Garamond",
    cssFamily: "'EB Garamond', serif",
    googleFamilyParam: "EB+Garamond:wght@400;500;600;700",
  },
  {
    id: "source-serif-4",
    label: "Source Serif 4",
    cssFamily: "'Source Serif 4', serif",
    googleFamilyParam: "Source+Serif+4:wght@400;500;600;700",
  },
  {
    id: "crimson-pro",
    label: "Crimson Pro",
    cssFamily: "'Crimson Pro', serif",
    googleFamilyParam: "Crimson+Pro:wght@400;500;600;700",
  },
];

export function findThaiFont(id: string): ReadingFontOption {
  return THAI_READING_FONTS.find((f) => f.id === id) ?? THAI_READING_FONTS[0];
}

export function findLatinFont(id: string): ReadingFontOption {
  return (
    LATIN_READING_FONTS.find((f) => f.id === id) ?? LATIN_READING_FONTS[0]
  );
}

// สเต็ปขนาดตัวอักษร (px) ของ reading mode — ปุ่ม A-/A+ ไล่ทีละสเต็ปในนี้
// (ดู grill-me 2026-08-21) index 2 (20px) = ค่าเริ่มต้น
export const READING_FONT_SIZE_STEPS = [16, 18, 20, 22, 24, 28, 32] as const;
export const DEFAULT_FONT_SIZE_STEP_INDEX = 2;

// แทรก <link rel="stylesheet"> ของ Google Fonts แบบ dynamic เฉพาะฟอนต์ที่ถูก
// เลือกจริง (ไม่โหลดทั้ง 12 ตัวล่วงหน้า) กันโหลดซ้ำด้วย Set ในหน่วยความจำ —
// เพจ index.html เดิมมี preconnect ให้ fonts.googleapis.com/fonts.gstatic.com
// อยู่แล้วสำหรับฟอนต์ที่ผูกไว้ตายตัว จึงยิง request ตรงนี้ได้เร็วขึ้นด้วย
const loadedGoogleFontParams = new Set<string>();

export function ensureGoogleFontLoaded(googleFamilyParam: string): void {
  if (typeof document === "undefined") return;
  if (loadedGoogleFontParams.has(googleFamilyParam)) return;
  loadedGoogleFontParams.add(googleFamilyParam);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${googleFamilyParam}&display=swap`;
  document.head.appendChild(link);
}
