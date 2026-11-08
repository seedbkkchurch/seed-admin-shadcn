// แชร์รูปที่สร้างในเบราว์เซอร์ (การ์ดสถิติเฝ้าเดี่ยว / การ์ดข้อพระคัมภีร์):
// มือถือ (จอสัมผัส + รองรับ Web Share แบบไฟล์) → หน้าต่างแชร์ของเครื่อง,
// คอมพิวเตอร์ หรือแชร์ไม่สำเร็จ → ดาวน์โหลด PNG (grill-me 2026-11-08)
// ควรเรียกทันทีใน click handler (รูปสร้างไว้ล่วงหน้าแล้ว) ไม่งั้น iOS Safari
// อาจไม่ยอมเปิดหน้าต่างแชร์เพราะหมดสิทธิ์ user gesture
export async function shareOrDownloadImage(
  blob: Blob,
  fileName: string,
  title: string,
) {
  // ใช้ชนิดไฟล์ตาม blob (PNG หรือ GIF เคลื่อนไหว)
  const file = new File([blob], fileName, { type: blob.type || "image/png" });
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (err) {
      // ผู้ใช้กดยกเลิกเอง — จบเลย ไม่ต้องดาวน์โหลด
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFileNamePart(value: string) {
  return value
    .replace(/[\\/:*?"<>|()]/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}
