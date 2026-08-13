import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type AttendanceNoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  note: string;
  onSave: (note: string) => void;
  isSaving?: boolean;
};

// Dialog เขียน "หมายเหตุ" บนมือถือ — บนมือถือคอลัมน์ note ถูกซ่อนออกจากตาราง (พื้นที่แคบ
// เกินไปสำหรับ inline input) เข้าถึงผ่านปุ่มไอคอนท้ายแถวแทน ต่างจาก desktop ที่พิมพ์ใน
// input แล้ว save ตอน blur ที่นี่ใช้ปุ่ม "บันทึก" ชัดเจน เพราะ blur ไม่ชัดเจนว่าเกิดตอนไหน
// เมื่อ keyboard มือถือปิด/เปิด dialog ปิด (ดู grill-me 2026-08-13, attendance mobile layout)
export function AttendanceNoteDialog({
  open,
  onOpenChange,
  memberName,
  note,
  onSave,
  isSaving,
}: AttendanceNoteDialogProps) {
  // draft แยกจาก note ที่ query มา — reset ทุกครั้งที่เปิด dialog ใหม่ กันค่าของสมาชิกคนก่อน
  // ค้างอยู่ตอนสลับไปเปิด dialog ของอีกคน
  const [draft, setDraft] = useState(note);

  useEffect(() => {
    if (open) setDraft(note);
  }, [open, note]);

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>หมายเหตุ — {memberName}</DialogTitle>
          <DialogDescription>เช่น ลาป่วย, ติดธุระ</DialogDescription>
        </DialogHeader>

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="เช่น ลาป่วย, ติดธุระ"
          rows={4}
          autoFocus
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
