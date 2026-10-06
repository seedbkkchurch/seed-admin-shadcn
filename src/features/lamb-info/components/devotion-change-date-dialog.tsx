import { useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type LambDevotionRow } from "../data/devotion-schema";
import { useUpdateLambDevotion } from "../data/queries";
import { DevotionDateCalendar } from "./devotion-date-picker";

// "เปลี่ยนวันที่" จากเมนู ⋮ ในตารางประวัติ (grill-me 2026-10-07) — เลือกวัน
// ในปฏิทินแล้วบันทึกทันที ไม่มีปุ่มยืนยันแยก เปลี่ยนแค่ devotion_date
// (created_at "ส่งเมื่อ" คงเดิม) สิทธิ์ตาม RLS เดิมของการแก้ไข
export function DevotionChangeDateDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: LambDevotionRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateDevotion = useUpdateLambDevotion();
  const [value, setValue] = useState(entry.devotion_date);

  const handleChange = (next: string) => {
    if (next === entry.devotion_date) {
      onOpenChange(false);
      return;
    }
    setValue(next);
    updateDevotion.mutate(
      { id: entry.id, values: { devotion_date: next } },
      {
        onSuccess: () => {
          toast.success(
            `เปลี่ยนวันที่เป็น ${format(parseISO(next), "d MMM yyyy")} แล้ว`,
          );
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          setValue(entry.devotion_date);
          toast.error("เปลี่ยนวันที่ไม่สำเร็จ", {
            description: err instanceof Error ? err.message : undefined,
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-auto max-w-[calc(100%-2rem)] sm:max-w-fit">
        <DialogHeader>
          <DialogTitle>เปลี่ยนวันที่</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {entry.title}
          </DialogDescription>
        </DialogHeader>
        <div
          className={
            updateDevotion.isPending ? "pointer-events-none opacity-60" : ""
          }
        >
          <DevotionDateCalendar value={value} onChange={handleChange} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
