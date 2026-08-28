import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openLineShare } from "@/lib/line-share";

// ปุ่มแชร์เฝ้าเดี่ยวที่ is_public=true — ใช้ทั้งบนหน้า public
// (devotion-public-detail.tsx) และหน้า owner-facing เดิมที่ต้อง login
// (devotion-detail.tsx) เมื่อรายการนั้นเป็น public (ดู grill-me 2026-08-16)
// "แชร์ไป LINE" เปิด LINE It ตรงๆ (ดู lib/line-share.ts) ส่วน
// "คัดลอกลิงก์" เป็นของแถมเล็กๆ เผื่อผู้ใช้อยากแปะลิงก์เองที่อื่น
// (ไม่ใช่ requirement หลัก แต่ implement ไม่กี่บรรทัด และมักถูกคาดหวังคู่กับ
// ปุ่มแชร์)
export function ShareButton({ url, text }: { url: string; text?: string }) {
  const [copied, setCopied] = useState(false);

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

  return (
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
    </div>
  );
}
