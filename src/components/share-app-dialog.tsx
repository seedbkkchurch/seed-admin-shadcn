import { useState } from "react";
import { Check, Download, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { openLineShare } from "@/lib/line-share";

// "แชร์แอปให้เพื่อน" (grill-me 2026-10-07) — QR ชี้ไปหน้าแรกของแอปบนโดเมน
// จริงเสมอ (ไม่ใช่ window.location.origin) เพื่อให้สแกนได้ถูกแม้เปิดจาก dev/
// preview เพื่อนที่มีบัญชีแล้วจะเข้าหน้าเข้าสู่ระบบ (แอปไม่มีสมัครสมาชิกเอง)
//
// QR เป็นรูปสำเร็จ public/images/share-app-qr.png (สร้างไว้ล่วงหน้า + ทดสอบ
// decode แล้ว) แทนการสร้างด้วย library ตอน runtime — ลิงก์คงที่ ไม่ต้องเพิ่ม
// dependency ถ้าเปลี่ยนโดเมนต้องสร้างรูป QR ใหม่ให้ตรงกับ APP_URL ด้วย
export const APP_URL = "https://admin.seedchurchth.org/";
const QR_IMAGE_SRC = "/images/share-app-qr.png";
const SHARE_TEXT = "มาใช้แอป Seed Church ด้วยกันนะ";

export function ShareAppDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      toast.success("คัดลอกลิงก์แล้ว");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("คัดลอกลิงก์ไม่สำเร็จ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>แชร์แอปให้เพื่อน</DialogTitle>
          <DialogDescription>
            ให้เพื่อนสแกน QR ด้วยกล้องมือถือเพื่อเปิดแอป
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          {/* พื้นขาวเสมอ (แม้ dark mode) ให้กล้องสแกนติดง่าย */}
          <div className="rounded-xl border bg-white p-2">
            <img
              src={QR_IMAGE_SRC}
              alt={`QR code ไปที่ ${APP_URL}`}
              className="size-56"
            />
          </div>
          <p className="text-muted-foreground text-sm break-all">{APP_URL}</p>
        </div>

        <div className="grid gap-2">
          <Button
            type="button"
            className="bg-[#06C755] text-white hover:bg-[#06C755]/90"
            onClick={() => openLineShare(APP_URL, SHARE_TEXT)}
          >
            <span className="text-xs font-bold">LINE</span>
            แชร์ไป LINE
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={handleCopy}>
              {copied ? <Check /> : <Link2 />}
              คัดลอกลิงก์
            </Button>
            <Button type="button" variant="outline" asChild>
              <a href={QR_IMAGE_SRC} download="seed-church-app-qr.png">
                <Download />
                บันทึกรูป QR
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
