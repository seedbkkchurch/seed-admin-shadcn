import { useLayoutEffect, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePrayerPhotoUrl } from "@/lib/supabase/prayer-photo";
import { resolvePrayerIcon } from "../data/icons";
import {
  PRAYER_ENTRY_TYPE_COPY,
  prayerDurationDays,
  prayerTypeHasPhoto,
  type PrayerRequest,
} from "../data/schema";

// ไอคอนบนการ์ดแท็บคำอธิษฐาน / สิ่งที่พระเจ้าคุยด้วย — ขนาดเท่ารูปแอนดรู
function PrayerIconBadge({ request }: { request: PrayerRequest }) {
  const Icon = resolvePrayerIcon(request.type, request.icon);
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon className="size-5" aria-hidden />
    </div>
  );
}

// รูปคนบนการ์ดแท็บแอนดรู — ดึง signed URL จาก bucket private, ไม่มีรูป =
// อักษรตัวแรกของชื่อ
function PrayerPhotoAvatar({ request }: { request: PrayerRequest }) {
  const { data: url } = usePrayerPhotoUrl(
    request.photo_path,
    request.updated_at,
  );
  return (
    <Avatar className="size-12 shrink-0">
      {url && <AvatarImage src={url} alt={request.title} />}
      <AvatarFallback>{request.title.trim().charAt(0) || "?"}</AvatarFallback>
    </Avatar>
  );
}

type PrayerRequestItemProps = {
  request: PrayerRequest;
  onEdit: () => void;
};

export function PrayerRequestItem({ request, onEdit }: PrayerRequestItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const setAnswered = useSetPrayerRequestAnswered();
  const deleteRequest = useDeletePrayerRequest();

  const durationDays = prayerDurationDays(request);
  const copy = PRAYER_ENTRY_TYPE_COPY[request.type];

  // ย่อ/ขยายข้อความ — วัดว่าล้น line-clamp จริงไหม (scrollHeight >
  // clientHeight) ทุกครั้งที่ข้อความหรือความกว้างการ์ดเปลี่ยน ตอนขยายอยู่
  // ไม่วัดซ้ำ ให้ปุ่ม "ย่อ" ค้างไว้
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const detailRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    if (expanded) return;
    const measure = () => {
      const overflows = [titleRef.current, detailRef.current].some(
        (el) => !!el && el.scrollHeight > el.clientHeight + 1,
      );
      setIsOverflowing(overflows);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (titleRef.current) observer.observe(titleRef.current);
    if (detailRef.current) observer.observe(detailRef.current);
    return () => observer.disconnect();
  }, [expanded, request.title, request.detail]);

  const canExpand = expanded || isOverflowing;

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
        onSuccess: () => toast.success(copy.answeredToast),
        onError: (error) =>
          toast.error("อัปเดตไม่สำเร็จ", {
            description: error instanceof Error ? error.message : undefined,
          }),
      },
    );
  };

  const handleConfirmDelete = () => {
    deleteRequest.mutate(
      { id: request.id, lambId: request.lamb_id, photoPath: request.photo_path },
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
            aria-label={copy.answeredAriaLabel}
          />

          {prayerTypeHasPhoto(request.type) ? (
            <PrayerPhotoAvatar request={request} />
          ) : (
            <PrayerIconBadge request={request} />
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {/* ข้อความยาวตัดเหลือ title 1 บรรทัด / detail 2 บรรทัด — กดที่
                ข้อความหรือ "ดูเพิ่มเติม" เพื่อขยายในการ์ด (ตกลงใน grill-me
                2026-10-28) ลิงก์โผล่เฉพาะเมื่อข้อความล้นจริง */}
            <div
              className={canExpand ? "cursor-pointer" : undefined}
              onClick={canExpand ? () => setExpanded((v) => !v) : undefined}
            >
              <p
                ref={titleRef}
                className={cn(
                  "font-medium leading-tight break-words",
                  !expanded && "line-clamp-1",
                )}
              >
                {request.title}
              </p>

              {request.detail && (
                <p
                  ref={detailRef}
                  className={cn(
                    "mt-1.5 text-sm text-muted-foreground whitespace-pre-wrap break-words",
                    !expanded && "line-clamp-2",
                  )}
                >
                  {request.detail}
                </p>
              )}
            </div>

            {canExpand && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="self-start text-xs font-medium text-primary hover:underline"
                aria-expanded={expanded}
              >
                {expanded ? "ย่อ" : "ดูเพิ่มเติม"}
              </button>
            )}

            <p className="text-xs text-muted-foreground">
              จดไว้เมื่อ {format(parseISO(request.created_at), "d MMM yyyy")}
              {request.is_answered && request.answered_date && (
                <>
                  {" "}
                  · {copy.answeredOnLabel}{" "}
                  {format(parseISO(request.answered_date), "d MMM yyyy")}
                  {durationDays !== null && <> (รอ {durationDays} วัน)</>}
                </>
              )}
            </p>

            {pendingAnswerPicker && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm">{copy.answeredAskDate}</span>
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
