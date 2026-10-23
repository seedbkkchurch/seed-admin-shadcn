// URL scheme สาธารณะของ LINE สำหรับเปิดหน้าต่างแชร์ (LINE It) — ไม่ต้องใช้ API
// key/token ใดๆ บนมือถือจะเด้งเปิดแอป LINE ให้เลือกแชท บน desktop จะเปิดหน้า
// เว็บให้สแกน QR/เลือกแชร์ต่อ ตกลงใน grill-me 2026-08-16
// ("เฝ้าเดียวทำให้สามารถเห็นได้โดยไม่ต้อง login อยากให้มีปุ่มแชร์...ในไลน์")
// ว่าใช้วิธีนี้แทน Web Share API เพราะทำงานเหมือนกันทุกอุปกรณ์ ไม่ต้องเช็ค
// navigator.share support
const LINE_SHARE_BASE = "https://social-plugins.line.me/lineit/share";

// ต่อ `openExternalBrowser=1` ท้ายลิงก์ที่แชร์ — พารามิเตอร์ที่ LINE รองรับ
// เอง ให้เปิดลิงก์ใน Safari/Chrome ของเครื่องแทน browser ในแอป LINE (ซึ่งไม่มี
// session ของผู้ใช้ และเคยทำให้หน้าเด้งวน) ดู grill-me 2026-10-23
export function withLineExternalBrowser(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("openExternalBrowser", "1");
    return parsed.toString();
  } catch {
    return url;
  }
}

export function buildLineShareUrl(url: string, text?: string): string {
  const params = new URLSearchParams({ url: withLineExternalBrowser(url) });
  if (text) params.set("text", text);
  return `${LINE_SHARE_BASE}?${params.toString()}`;
}

export function openLineShare(url: string, text?: string): void {
  window.open(buildLineShareUrl(url, text), "_blank", "noopener,noreferrer");
}
