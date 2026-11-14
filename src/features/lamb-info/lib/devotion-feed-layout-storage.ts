const STORAGE_KEY = "devotion-feed-layout-v1";

// "gallery" = รูปเต็มการ์ดแบบ masonry (ค่าเริ่มต้น), "list" = รายการแบบเดิม
export type DevotionFeedLayout = "list" | "gallery";

// เดิมเริ่มที่ "list" (grill-me 2026-11-15) — เปลี่ยนค่าเริ่มต้นเป็น "gallery"
// ตามคำขอวันเดียวกัน คนที่เคยกดเลือก "list" ไว้เองยังได้ "list" เหมือนเดิม
const DEFAULT_LAYOUT: DevotionFeedLayout = "gallery";

// จำ layout ของหน้าฟีดเฝ้าเดี่ยวที่เลือกไว้ต่อเครื่อง — แบบเดียวกับ
// reading-mode-storage.ts ของหน้าพระคัมภีร์ อ่าน/เขียนไม่ได้ (private mode
// ฯลฯ) ก็ใช้ค่าเริ่มต้นไป ไม่ throw
export function loadDevotionFeedLayout(): DevotionFeedLayout {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "list" || stored === "gallery" ? stored : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function saveDevotionFeedLayout(layout: DevotionFeedLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, layout);
  } catch {
    // ไม่มี storage ให้ใช้ — ข้ามไป layout ยังสลับได้ในหน้านี้ตามปกติ
  }
}
