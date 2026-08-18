import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useDeletePrayerRequest,
  useSetPrayerRequestAnswered,
} from "../data/queries";
import { prayerDurationDays, type PrayerRequest } from "../data/schema";

type PrayerRequestItemProps = {
  request: PrayerRequest;
  onEdit: () => void;
};

export function PrayerRequestItem({ request, onEdit }: PrayerRequestItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const setAnswered = useSetPrayerRequestAnswered();
  const deleteRequest = useDeletePrayerRequest();

  const durationDays = prayerDurationDays(request);

  // ติ๊ก = เปิด date picker ให้เลือกวันที่พระเจ้าตอบ (default วันนี้ แก้ได้ —
  // ตกลงใน grill-me) ยังไม่ยิง mutation จนกว่าจะเลือกวันจริง กันเคสกดติ๊ก
  // พลาดแล้วต้องมาแก้ answered_date ทีหลัง
  const [pendingAnswerPicker, setPendingAnswerPicker] = useState(false);

  // Radix ส่ง CheckedState (boolean | "indeterminate") มาให้ — เช็คบ็อกซ์นี้
  // ไม่มี indeterminate state ใช้จริง ปฏิบัติเหมือน false
  const handleCheckedChange = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setPendingAnswerPicker(true);
      return;
    }
    // uncheck = revert กลับเป็นยังไม่ตอบ (ตกลงว่าให้กลับสถานะได้)
    setAnswered.mutate(
      { id: request.id, lambId: request.lamb_id, answeredDate: null },
      {
        onError: (error) =>
          toast.error("อัปเดตไม่สำเร็จ", {
            description: error instanceof Error ? error.message : undefined,
          }),
      },
    );
  };

  const handlePickAnsweredDate = (date: Date | undefined) => {
    if (!date) return;
    setPendingAnswerPicker(false);
    setAnswered.mutate(
      {
        id: request.id,
        lambId: request.lamb_id,
        answeredDate: format(date, "yyyy-MM-dd"),
      },
      {
        onSuccess: () => toast.success("บันทึกว่าพระเจ้าตอบแล้ว"),
        onError: (error) =>
          toast.error("อัปเดตไม่สำเร็จ", {
            description: error instanceof Error ? error.message : undefined,
          }),
      },
    );
  };

  const handleConfirmDelete = () => {
    deleteRequest.mutate(
      { id: request.id, lambId: request.lamb_id },
      {
        onSuccess: () => {
          toast.success("ลบรายการแล้ว");
          setDeleteDialogOpen(false);
        },
        onError: (error) =>
          toast.error("ลบไม่สำเร็จ", {
            description: error instanceof Error ? error.message : undefined,
          }),
      },
    );
  };

  return (
    <>
      <Card>
        <CardContent className="flex items-start gap-3">
          <Checkbox
            checked={request.is_answered}
            onCheckedChange={handleCheckedChange}
            className="mt-1"
            aria-label="พระเจ้าตอบแล้ว"
          />

          <div className="flex flex-1 flex-col gap-1.5">
            <p className="font-medium leading-tight">{request.title}</p>

            {request.detail && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {request.detail}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              จดไว้เมื่อ {format(parseISO(request.created_at), "d MMM yyyy")}
              {request.is_answered && request.answered_date && (
                <>
                  {" "}
                  · พระเจ้าตอบเมื่อ{" "}
                  {format(parseISO(request.answered_date), "d MMM yyyy")}
                  {durationDays !== null && <> (รอ {durationDays} วัน)</>}
                </>
              )}
            </p>

            {pendingAnswerPicker && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm">พระเจ้าตอบวันไหน?</span>
                <DatePicker
                  selected={new Date()}
                  onSelect={handlePickAnsweredDate}
                  placeholder="เลือกวันที่"
                />
              </div>
            )}
          </div>

          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="แก้ไข">
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              aria-label="ลบ"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        handleConfirm={handleConfirmDelete}
        title="ลบรายการนี้?"
        desc="ลบแล้วกู้คืนไม่ได้"
        confirmText="ลบ"
        cancelBtnText="ยกเลิก"
        destructive
        isLoading={deleteRequest.isPending}
      />
    </>
  );
}
