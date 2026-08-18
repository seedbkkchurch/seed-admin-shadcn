import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePrayerRequest, useUpdatePrayerRequest } from "../data/queries";
import {
  PRAYER_ENTRY_TYPE_LABEL,
  type PrayerEntryType,
  type PrayerRequest,
} from "../data/schema";

type PrayerRequestFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lambId: string;
  type: PrayerEntryType;
  // ไม่ส่ง = โหมดเพิ่มใหม่, ส่ง = โหมดแก้ไขรายการเดิม (แก้ได้แค่ title/
  // detail — type/lamb_id คงที่ตั้งแต่สร้าง เหมือนแพทเทิร์นของ lamb_devotion
  // ที่ไม่ให้แก้ lamb_id/devotion_date หลังสร้าง)
  editingRequest?: PrayerRequest;
};

// ใช้ทั้งเพิ่มใหม่และแก้ไข — ฟอร์มเล็ก (title บังคับ, detail optional) ไม่
// จำเป็นต้องใช้ react-hook-form/zod แบบฟอร์มใหญ่อื่นในโปรเจกต์ (เช่น
// lamb-info-action-dialog) local state พอ
//
// หมายเหตุ: ตัดปุ่ม "แชร์ให้หัวหน้าเซล/หัวหน้าทีมเห็น" (is_shared) ออกจากฟอร์ม
// ตามคำขอผู้ใช้ (2026-08-18) — ผู้ใช้รายงานว่า toggle นี้ "ใช้ไม่ได้" แม้
// ตรวจ log แล้วพบว่า mutation จริงๆ สำเร็จ (PATCH คืน 200 ทั้งสองครั้ง) แต่
// ผู้ใช้ยืนยันให้เอาออกก่อน — คอลัมน์ is_shared และ RLS policy ฝั่งเจ้าของ/
// leader ใน docs/prayer-list-db-design.md ยังอยู่ในฐานข้อมูลเหมือนเดิม
// (ไม่ได้ลบ schema) แค่ไม่มีทางเปิดใช้จาก UI แล้วตอนนี้ ทุกรายการใหม่จะเป็น
// is_shared=false (default เดิมของคอลัมน์) เสมอ
export function PrayerRequestFormDialog({
  open,
  onOpenChange,
  lambId,
  type,
  editingRequest,
}: PrayerRequestFormDialogProps) {
  const isEditMode = !!editingRequest;
  const [title, setTitle] = useState(editingRequest?.title ?? "");
  const [detail, setDetail] = useState(editingRequest?.detail ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRequest = useCreatePrayerRequest();
  const updateRequest = useUpdatePrayerRequest();

  // sync ฟอร์มใหม่ทุกครั้งที่เปิด dialog ด้วยรายการที่กำลังแก้ (หรือฟอร์ม
  // เปล่าถ้าเป็นโหมดเพิ่มใหม่) — กันค่าค้างจากรายการก่อนหน้าตอนสลับ
  // เปิด/ปิดหลายรอบ
  useEffect(() => {
    if (!open) return;
    setTitle(editingRequest?.title ?? "");
    setDetail(editingRequest?.detail ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingRequest?.id]);

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateRequest.mutateAsync({
          id: editingRequest.id,
          lambId,
          values: {
            title: title.trim(),
            detail: detail.trim() || null,
          },
        });
        toast.success("แก้ไขรายการแล้ว");
      } else {
        await createRequest.mutateAsync({
          lamb_id: lambId,
          type,
          title: title.trim(),
          detail: detail.trim() || null,
        });
        toast.success("เพิ่มรายการแล้ว");
      }
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error("บันทึกไม่สำเร็จ", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "แก้ไข" : "เพิ่ม"}
            {PRAYER_ENTRY_TYPE_LABEL[type]}
          </DialogTitle>
          <DialogDescription>
            {type === "prayer"
              ? "จดสิ่งที่อธิษฐานเผื่อ แล้วกลับมาติ๊กเมื่อพระเจ้าตอบ"
              : "จดสิ่งที่พระเจ้าพูดหรือสื่อกับคุณ"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prayer-request-title">หัวข้อ</Label>
            <Input
              id="prayer-request-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น สุขภาพคุณแม่"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prayer-request-detail">รายละเอียด (ไม่บังคับ)</Label>
            <Textarea
              id="prayer-request-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
