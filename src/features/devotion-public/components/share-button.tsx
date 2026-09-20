import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Check, ImageDown, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openLineShare } from "@/lib/line-share";
import { DevotionShareCard } from "./devotion-share-card";

// ปุ่มแชร์เฝ้าเดี่ยวที่ is_public=true — ใช้ทั้งบนหน้า public
// (devotion-public-detail.tsx) และหน้า owner-facing เดิมที่ต้อง login
// (devotion-detail.tsx) เมื่อรายการนั้นเป็น public (ดู grill-me 2026-08-16)
// "แชร์ไป LINE" เปิด LINE It ตรงๆ (ดู lib/line-share.ts) ส่วน
// "คัดลอกลิงก์" เป็นของแถมเล็กๆ เผื่อผู้ใช้อยากแปะลิงก์เองที่อื่น
// (ไม่ใช่ requirement หลัก แต่ implement ไม่กี่บรรทัด และมักถูกคาดหวังคู่กับ
// ปุ่มแชร์)
//
// "บันทึกภาพ" (ดู grill-me 2026-09-20) เพิ่มการ์ดสรุปแบบ og:image
// (1200x630, รูปปก + ชื่อ + สนิปเนื้อหา) ให้ผู้ใช้เซฟเก็บ/แชร์เป็นรูปได้เอง
// แยกจาก 2 ปุ่มเดิมที่แชร์เป็น "ลิงก์" — ปุ่มนี้ให้ "ไฟล์ภาพ" แทน ใช้เงื่อนไข
// การมองเห็นเดียวกับปุ่ม LINE (ผู้เรียกต้อง render ปุ่มนี้เฉพาะ is_public
// เหมือนที่ devotion-detail.tsx/devotion-public-detail.tsx ทำอยู่แล้ว)
//
// การ์ดถูก render off-screen ที่ขนาดจริง 1200x630 เสมอ (ไม่ผูกกับ responsive
// layout ของหน้าจริง) แล้วจับภาพด้วย html-to-image ตอนกดปุ่มเท่านั้น
// (ไม่ capture ล่วงหน้า เพื่อไม่ต้องดึงรูปปกทุกครั้งที่เปิดหน้า)
export function ShareButton({
  url,
  text,
  snippet,
  imageUrl,
}: {
  url: string;
  text?: string;
  snippet?: string;
  imageUrl?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  // true เฉพาะช่วงที่ retry capture แบบไม่มีรูปปก (ดู handleSaveImage) —
  // ไม่ใช่ state ถาวรของรูป เพราะรูปปกอาจโหลดสำเร็จได้ในครั้งถัดไป
  const [imageFailed, setImageFailed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("คัดลอกลิงก์แล้ว");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("คัดลอกลิงก์ไม่สำเร็จ");
    }
  };

  const captureCard = async () => {
    const node = cardRef.current;
    if (!node) return null;
    // pixelRatio 2 ให้ไฟล์ผลลัพธ์คมบนมือถือจอ retina (2400x1260 จริง)
    // cacheBust กัน browser cache รูปเก่าไว้เฉยๆ ตอน capture ครั้งถัดไป
    return toPng(node, { pixelRatio: 2, cacheBust: true });
  };

  const handleSaveImage = async () => {
    setSaving(true);
    try {
      let dataUrl: string | null;
      try {
        dataUrl = await captureCard();
      } catch {
        // รูปปกอาจโหลดไม่ติด (bucket ปิด CORS/เน็ตหลุดตอน fetch รูป) —
        // ลองใหม่อีกครั้งแบบไม่มีรูป (พื้นหลังสี) ให้ยังได้ภาพติดมือ
        // ดีกว่าล้มเหลวเงียบๆ
        toast.info("โหลดรูปปกไม่สำเร็จ กำลังสร้างภาพแบบไม่มีรูป…");
        setImageFailed(true);
        // รอ 1 tick ให้ DOM ของการ์ด re-render โดยไม่มี <img> ก่อน capture ใหม่
        await new Promise((resolve) => setTimeout(resolve, 50));
        dataUrl = await captureCard();
      }
      if (!dataUrl) throw new Error("capture failed");

      const link = document.createElement("a");
      link.download = "เฝ้าเดี่ยว.png";
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("บันทึกภาพไม่สำเร็จ");
    } finally {
      setSaving(false);
      setImageFailed(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="bg-[#06C755] text-white hover:bg-[#06C755]/90"
          onClick={() => openLineShare(url, text)}
        >
          {/* LINE ไม่มีไอคอนใน lucide-react — ใช้ตัวอักษร "LINE" ธรรมดาแทน
          โลโก้ทางการ เลี่ยงปัญหาลิขสิทธิ์/ความไม่ตรง asset */}
          <span className="text-xs font-bold">LINE</span>
          แชร์ไป LINE
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
          {copied ? <Check /> : <Link2 />}
          คัดลอกลิงก์
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={handleSaveImage}
        >
          <ImageDown />
          {saving ? "กำลังบันทึก…" : "บันทึกภาพ"}
        </Button>
      </div>

      {/* การ์ดสำหรับ capture — วางไว้นอกจอถาวร ไม่ใช้ display:none เพราะ
      html-to-image/browser จะไม่ layout element ที่ display:none ให้
      (ต้องมี layout จริงถึงจะ capture ได้ขนาดถูกต้อง) */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "-9999px",
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <DevotionShareCard
          ref={cardRef}
          title={text ?? "เฝ้าเดี่ยว"}
          snippet={snippet ?? ""}
          imageUrl={imageUrl}
          imageFailed={imageFailed}
        />
      </div>
    </>
  );
}
