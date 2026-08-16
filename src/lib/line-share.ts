// URL scheme สาธารณะของ LINE สำหรับเปิดหน้าต่างแชร์ (LINE It) — ไม่ต้องใช้ API
// key/token ใดๆ บนมือถือจะเด้งเปิดแอป LINE ให้เลือกแชท บน desktop จะเปิดหน้า
// เว็บให้สแกน QR/เลือกแชร์ต่อ ตกลงใน grill-me 2026-08-16
// ("เฝ้าเดียวทำให้สามารถเห็นได้โดยไม่ต้อง login อยากให้มีปุ่มแชร์...ในไลน์")
// ว่าใช้วิธีนี้แทน Web Share API เพราะทำงานเหมือนกันทุกอุปกรณ์ ไม่ต้องเช็ค
// navigator.share support
const LINE_SHARE_BASE = "https://social-plugins.line.me/lineit/share";

export function buildLineShareUrl(url: string, text?: string): string {
  const params = new URLSearchParams({ url });
  if (text) params.set("text", text);
  return `${LINE_SHARE_BASE}?${params.toString()}`;
}

export function openLineShare(url: string, text?: string): void {
  window.open(buildLineShareUrl(url, text), "_blank", "noopener,noreferrer");
}
