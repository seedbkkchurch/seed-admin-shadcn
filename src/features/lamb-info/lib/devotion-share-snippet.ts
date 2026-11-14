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

// แปลง content_html เป็นข้อความล้วนแยกย่อหน้า (ไม่ตัดความยาว) — ใช้กับ
// เนื้อหาเต็มที่โผล่บนการ์ดตอน hover ในฟีดแบบรูปเต็มการ์ด (grill-me
// 2026-11-15) ไม่ re-render HTML เดิมเพราะการ์ดทั้งใบเป็นลิงก์อยู่แล้ว (ลิงก์/
// รูปซ้อนข้างในไม่ได้) อ่านแค่ textContent ของแต่ละบล็อกเหมือนฟังก์ชันด้านบน
const TEXT_BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre";

export function htmlToPlainTextParagraphs(html: string): string[] {
  const container = document.createElement("div");
  container.innerHTML = html;
  const clean = (text: string | null) =>
    (text ?? "").replace(/\s+/g, " ").trim();

  const paragraphs = Array.from(container.querySelectorAll(TEXT_BLOCK_SELECTOR))
    // ข้ามบล็อกที่ครอบบล็อกอื่นอยู่ (เช่น blockquote > p, li > p) กันข้อความซ้ำ
    .filter((element) => !element.querySelector(TEXT_BLOCK_SELECTOR))
    .map((element) => clean(element.textContent))
    .filter(Boolean);

  if (paragraphs.length > 0) return paragraphs;
  const whole = clean(container.textContent);
  return whole ? [whole] : [];
}
