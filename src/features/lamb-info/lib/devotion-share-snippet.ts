// ตัดเนื้อหา HTML (content_html ของเฝ้าเดี่ยว) ให้เป็น plain text สั้นๆ
// สำหรับใช้เป็น "สนิป" บนการ์ดที่เซฟเป็นภาพ (ดู grill-me 2026-09-20)
// ใช้ DOM parsing (ไม่ใช่ regex strip tag) เพื่อจัดการ entity/nested tag
// ได้ถูกต้อง — ปลอดภัยเพราะแค่อ่าน textContent ไม่ได้ re-render เป็น HTML
export function htmlToPlainTextSnippet(html: string, maxLength = 140): string {
  const container = document.createElement("div");
  container.innerHTML = html;
  const text = (container.textContent ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
