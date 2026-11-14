const STORAGE_KEY = "devotion-feed-layout-v1";

// "list" = รายการแบบเดิม (ค่าเริ่มต้น), "gallery" = รูปเต็มการ์ดแบบ masonry
export type DevotionFeedLayout = "list" | "gallery";

// จำ layout ของหน้าฟีดเฝ้าเดี่ยวที่เลือกไว้ต่อเครื่อง (grill-me 2026-11-15) —
// แบบเดียวกับ reading-mode-storage.ts ของหน้าพระคัมภีร์ อ่าน/เขียนไม่ได้
// (private mode ฯลฯ) ก็ใช้ค่าเริ่มต้นไป ไม่ throw
export function loadDevotionFeedLayout(): DevotionFeedLayout {
  try {
    return localStorage.getItem(STORAGE_KEY) === "gallery" ? "gallery" : "list";
  } catch {
    return "list";
  }
}

export function saveDevotionFeedLayout(layout: DevotionFeedLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, layout);
  } catch {
    // ไม่มี storage ให้ใช้ — ข้ามไป layout ยังสลับได้ในหน้านี้ตามปกติ
  }
}
