// จานสีพรีเซ็ตสำหรับปุ่ม Color (สีตัวอักษร) และ Highlight (สีเน้นข้อความ)
// ใน ArticleEditor — ใช้จานเดียวกันทั้งสองปุ่ม (ตกลงใน grill-me 2026-08-25)
//
// เลือกมาให้ "อ่านได้ทั้งสองโทน" (ตกลงใน grill-me 2026-08-25, เพราะ
// content_html ถูกฝัง inline style="color:#..." ตรงๆ ไม่ปรับตาม
// prefers-color-scheme/ThemeSwitch) — คนละแนวคิดกับ token สี light/dark
// ของแอพเอง (--foreground ฯลฯ) เพราะสีพวกนี้ต้องคงที่ ไม่ใช่ CSS variable:
//   - เป็นสีโทนกลาง (mid-tone) ไม่จัดเข้ม/จัดอ่อนจนกลืนกับพื้นหลังฝั่งใดฝั่งหนึ่ง
//   - ใช้เป็นทั้งสีตัวอักษรบนพื้นโปร่ง และสีพื้นหลัง highlight ที่มีตัวอักษร
//     สีเข้ม (--foreground เดิม) ทับอยู่ด้านบนได้ทั้งคู่
export type DevotionContentColorSwatch = {
  label: string;
  value: string;
};

export const DEVOTION_CONTENT_COLOR_SWATCHES: DevotionContentColorSwatch[] = [
  { label: "แดง", value: "#e11d48" },
  { label: "ส้ม", value: "#ea580c" },
  { label: "เหลือง", value: "#ca8a04" },
  { label: "เขียว", value: "#16a34a" },
  { label: "ฟ้า", value: "#0891b2" },
  { label: "น้ำเงิน", value: "#2563eb" },
  { label: "ม่วง", value: "#7c3aed" },
  { label: "ชมพู", value: "#db2777" },
];
