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
import { AvatarUpload } from "@/components/avatar-upload";
import { cn } from "@/lib/utils";
import { PRAYER_ICONS } from "../data/icons";
import {
  deletePrayerPhoto,
  uploadPrayerPhoto,
  usePrayerPhotoUrl,
} from "@/lib/supabase/prayer-photo";
import { useCreatePrayerRequest, useUpdatePrayerRequest } from "../data/queries";
import {
  prayerTypeHasPhoto,
  PRAYER_ENTRY_TYPE_COPY,
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
  const copy = PRAYER_ENTRY_TYPE_COPY[type];
  const [title, setTitle] = useState(editingRequest?.title ?? "");
  const [detail, setDetail] = useState(editingRequest?.detail ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // รูปคน (เฉพาะแท็บแอนดรู) — AvatarUpload โหมด deferred ครอป/ย่อให้แล้ว
  // เก็บ blob ไว้ก่อน อัปโหลดตอนกดบันทึก (ต้องรู้ id รายการก่อนถึงจะตั้ง
  // path ได้) photoKey ใช้ remount AvatarUpload ตอนกด "ลบรูป" ให้ล้าง preview
  const showPhoto = prayerTypeHasPhoto(type);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoKey, setPhotoKey] = useState(0);
  const existingPhotoPath = removePhoto ? null : editingRequest?.photo_path;
  const { data: existingPhotoUrl } = usePrayerPhotoUrl(
    showPhoto ? existingPhotoPath : null,
    editingRequest?.updated_at,
  );
  const hasPhoto = !!photoBlob || !!existingPhotoPath;

  // ไอคอน (แท็บคำอธิษฐาน / สิ่งที่พระเจ้าคุยด้วย) — ไม่บังคับ, กดซ้ำ = ยกเลิก
  const [icon, setIcon] = useState<string | null>(editingRequest?.icon ?? null);

  const createRequest = useCreatePrayerRequest();
  const updateRequest = useUpdatePrayerRequest();

  // sync ฟอร์มใหม่ทุกครั้งที่เปิด dialog ด้วยรายการที่กำลังแก้ (หรือฟอร์ม
  // เปล่าถ้าเป็นโหมดเพิ่มใหม่) — กันค่าค้างจากรายการก่อนหน้าตอนสลับ
  // เปิด/ปิดหลายรอบ
  useEffect(() => {
    if (!open) return;
    setTitle(editingRequest?.title ?? "");
    setDetail(editingRequest?.detail ?? "");
    setIcon(editingRequest?.icon ?? null);
    setPhotoBlob(null);
    setRemovePhoto(false);
    setPhotoKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingRequest?.id]);

  const handleRemovePhoto = () => {
    setPhotoBlob(null);
    setRemovePhoto(true);
    setPhotoKey((k) => k + 1);
  };

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        let photoPath: string | null | undefined;
        if (showPhoto && photoBlob) {
          photoPath = await uploadPrayerPhoto({
            blob: photoBlob,
            lambId,
            requestId: editingRequest.id,
          });
        } else if (removePhoto && editingRequest.photo_path) {
          await deletePrayerPhoto(editingRequest.photo_path).catch(
            () => undefined,
          );
          photoPath = null;
        }

        await updateRequest.mutateAsync({
          id: editingRequest.id,
          lambId,
          values: {
            title: title.trim(),
            detail: detail.trim() || null,
            ...(!showPhoto && { icon }),
            ...(photoPath !== undefined && { photo_path: photoPath }),
          },
        });
        toast.success("แก้ไขรายการแล้ว");
      } else {
        const created = await createRequest.mutateAsync({
          lamb_id: lambId,
          type,
          title: title.trim(),
          detail: detail.trim() || null,
          icon: showPhoto ? null : icon,
        });

        if (showPhoto && photoBlob) {
          try {
            const photoPath = await uploadPrayerPhoto({
              blob: photoBlob,
              lambId,
              requestId: created.id,
            });
            await updateRequest.mutateAsync({
              id: created.id,
              lambId,
              values: { photo_path: photoPath },
            });
          } catch (error: unknown) {
            // แถวบันทึกแล้ว แค่รูปไม่ขึ้น — แจ้งให้กดแก้ไขแล้วใส่รูปใหม่
            toast.warning("เพิ่มรายการแล้ว แต่อัปโหลดรูปไม่สำเร็จ", {
              description: error instanceof Error ? error.message : undefined,
            });
            onOpenChange(false);
            return;
          }
        }
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
          <DialogDescription>{copy.dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {showPhoto && (
            <div className="flex items-center gap-4">
              <AvatarUpload
                key={photoKey}
                mode="deferred"
                imageUrl={existingPhotoUrl}
                initials={title.trim().charAt(0) || "?"}
                className="size-20 shrink-0"
                disabled={isSubmitting}
                onFileReady={(blob) => {
                  setPhotoBlob(blob);
                  if (blob) setRemovePhoto(false);
                }}
              />
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-medium">รูป (ไม่บังคับ)</span>
                <span className="text-muted-foreground text-xs">
                  กดที่กรอบเพื่อเลือกรูป จะได้จำหน้าได้ — เห็นได้เฉพาะคุณ
                </span>
                {hasPhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isSubmitting}
                    className="self-start text-xs font-medium text-destructive hover:underline"
                  >
                    ลบรูป
                  </button>
                )}
              </div>
            </div>
          )}

          {!showPhoto && (
            <div className="flex flex-col gap-1.5">
              <Label>ไอคอน (ไม่บังคับ)</Label>
              <div
                role="radiogroup"
                aria-label="เลือกไอคอน"
                className="grid grid-cols-8 gap-1.5"
              >
                {PRAYER_ICONS.map(({ key, label, Icon }) => {
                  const selected = icon === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={label}
                      title={label}
                      disabled={isSubmitting}
                      onClick={() => setIcon(selected ? null : key)}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-full border transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </button>
                  );
                })}
              </div>
              <span className="text-muted-foreground text-xs">
                {icon
                  ? PRAYER_ICONS.find((i) => i.key === icon)?.label
                  : "ไม่เลือก = ใช้ไอคอนตั้งต้นของแท็บ"}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prayer-request-title">{copy.titleLabel}</Label>
            <Input
              id="prayer-request-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={copy.titlePlaceholder}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prayer-request-detail">{copy.detailLabel}</Label>
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
