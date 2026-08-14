import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Eraser, ImageIcon, Loader2, Type as TypeIcon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { uploadDevotionImage } from "@/lib/supabase/devotion-image";
import { useCreateLambDevotion } from "../data/queries";
import {
  clearDevotionDialogDraft,
  loadDevotionDialogDraft,
  saveDevotionDialogDraft,
} from "../lib/devotion-draft-storage";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type DevotionUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lambId: string;
  today: Date;
};

// Quick-capture "ส่งเฝ้าเดี่ยว" dialog on the lamb's profile page — a
// lighter-weight alternative to the full Medium-style editor at
// /lamb-info/devotion/new: plain text OR a single photo, no separate
// title field (title is auto-filled from the date, since this dialog is
// meant for a quick daily check-in rather than writing an article).
// Persists to the real `lamb_devotion` table per grill-me follow-up
// (2026-08-11) — it used to only touch local component state. ส่งได้ไม่
// จำกัดจำนวนครั้ง/วัน (ดู grill-me 2026-08-14,
// `devotion_multi_submit_design`).
//
// Draft-recovery: เฉพาะข้อความ tab "พิมพ์ข้อความ" เท่านั้น (ไฟล์รูปเป็น
// File object เก็บ localStorage ไม่ได้) สโคปแยกตาม lambId กันสลับไปโปรไฟล์
// คนอื่นแล้วเจอร่างของคนก่อน ดู lib/devotion-draft-storage.ts
export function DevotionUploadDialog({
  open,
  onOpenChange,
  lambId,
  today,
}: DevotionUploadDialogProps) {
  const [tab, setTab] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const createDevotion = useCreateLambDevotion();

  // เผลอรีเฟรชตอน dialog เปิดค้างเขียนอยู่ — เปิด dialog อัตโนมัติพร้อม
  // ข้อความเดิมกลับมา (ตกลงใน grill-me 2026-08-14,
  // `devotion_multi_submit_design`) ทำครั้งเดียวตอน mount
  const hasCheckedInitialDraft = useRef(false);
  useEffect(() => {
    if (hasCheckedInitialDraft.current) return;
    hasCheckedInitialDraft.current = true;
    if (loadDevotionDialogDraft(lambId, today)) {
      onOpenChange(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // กู้ร่างกลับมาทุกครั้งที่ dialog เปิด (ไม่ว่าจะเปิดเองหรือเปิดอัตโนมัติ
  // ด้านบน) — ครอบคลุมเคสกด "ยกเลิก" ไปแล้วเปิดใหม่อีกทีด้วย เพราะ
  // resetForm() ล้างแค่ state ในจอ ไม่ได้ลบร่างที่บันทึกไว้จริง
  useEffect(() => {
    if (!open) return;
    const draft = loadDevotionDialogDraft(lambId, today);
    if (draft) {
      setText(draft.text);
      setIsPublic(draft.isPublic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // บันทึกร่างทุกครั้งที่พิมพ์ — ลบทิ้งถ้าพิมพ์จนว่างเปล่าอีกครั้ง กัน
  // ร่างว่างๆ ค้างอยู่ใน localStorage
  useEffect(() => {
    if (text.trim() === "") {
      clearDevotionDialogDraft(lambId);
      return;
    }
    saveDevotionDialogDraft(lambId, { text, isPublic }, today);
  }, [text, isPublic, lambId, today]);

  const resetForm = () => {
    setTab("text");
    setText("");
    setImageFile(null);
    setImagePreviewUrl(null);
    setIsPublic(true);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  // ล้างข้อมูลจริง แยกจากปุ่ม "ยกเลิก" — ต้องกดยืนยันก่อนเสมอ (ตกลงใน
  // grill-me 2026-08-14) ล้างทั้งฟอร์มและร่างที่บันทึกไว้ แต่ไม่ปิด dialog
  // (เผื่ออยากเขียนใหม่ต่อทันที)
  const handleConfirmClear = () => {
    resetForm();
    clearDevotionDialogDraft(lambId);
    setClearDialogOpen(false);
  };

  const hasContentToClear = text.trim().length > 0 || imageFile !== null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP เท่านั้น");
      return;
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const canSubmit =
    (tab === "text" ? text.trim().length > 0 : imageFile !== null) &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      let contentHtml: string;
      let imageUrls: string[];

      if (tab === "text") {
        contentHtml = `<p>${escapeHtml(text.trim())}</p>`;
        imageUrls = [];
      } else {
        if (!imageFile) return;
        const url = await uploadDevotionImage(imageFile, isPublic);
        contentHtml = `<img src="${url}" alt="เฝ้าเดี่ยว" />`;
        imageUrls = [url];
      }

      await createDevotion.mutateAsync({
        lamb_id: lambId,
        devotion_date: format(today, "yyyy-MM-dd"),
        title: `เฝ้าเดี่ยว ${format(today, "d MMMM yyyy")}`,
        content_html: contentHtml,
        image_urls: imageUrls,
        is_public: isPublic,
      });

      toast.success("บันทึกเฝ้าเดี่ยวแล้ว");
      resetForm();
      clearDevotionDialogDraft(lambId);
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
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>ส่งเฝ้าเดี่ยว</DialogTitle>
            <DialogDescription>
              {format(today, "d MMMM yyyy")} — เลือกส่งเป็นข้อความหรือรูปภาพ
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="text">
                <TypeIcon /> พิมพ์ข้อความ
              </TabsTrigger>
              <TabsTrigger value="image">
                <ImageIcon /> อัปโหลดรูป
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="เขียนสิ่งที่ได้รับจากการเฝ้าเดี่ยววันนี้..."
                rows={6}
                autoFocus
              />
            </TabsContent>

            <TabsContent value="image" className="mt-2 space-y-3">
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={handleImageChange}
                className="text-sm"
              />
              {imagePreviewUrl && (
                <img
                  src={imagePreviewUrl}
                  alt="ตัวอย่างรูปเฝ้าเดี่ยว"
                  className="max-h-64 w-full rounded-md border object-contain"
                />
              )}
            </TabsContent>
          </Tabs>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            เผยแพร่ในหน้าเฝ้าเดี่ยวสาธารณะ
          </label>

          <DialogFooter>
            {/* ปุ่มล้างข้อมูลแยกจาก "ยกเลิก" — ยกเลิกแค่ปิด dialog (ร่างยัง
            อยู่ เปิดใหม่ก็เจอเหมือนเดิม) ส่วนล้างข้อมูลคือลบทิ้งจริง ต้อง
            ยืนยันก่อนเสมอ (ตกลงใน grill-me 2026-08-14,
            `devotion_multi_submit_design`) */}
            <Button
              variant="outline"
              onClick={() => setClearDialogOpen(true)}
              disabled={!hasContentToClear}
            >
              <Eraser /> ล้างข้อมูล
            </Button>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        handleConfirm={handleConfirmClear}
        title="ล้างข้อมูลที่เขียนไว้ทั้งหมด?"
        desc="ข้อความหรือรูปที่เลือกไว้จะหายไปทั้งหมด กู้คืนไม่ได้"
        confirmText="ล้างข้อมูล"
        cancelBtnText="ยกเลิก"
        destructive
      />
    </>
  );
}
