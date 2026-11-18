import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { cropAndResizeImage } from "@/lib/image-resize";
import { supabase } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/supabase/avatar";
import type { MyLamb } from "@/hooks/use-my-lamb";

// รูปโปรไฟล์ใหญ่บนหัวหน้า "จิตวิญญาณของฉัน" (grill-me 2026-11-18)
// - สี่เหลี่ยมมน (เปลี่ยนจากวงกลม, grill-me 2026-11-18 รอบ 2) ข้างหัวข้อหน้า
//   ขนาดจาก className ของผู้เรียก (96px มือถือ / 128px จอใหญ่)
// - กดรูป = ไปหน้าโปรไฟล์ตัวเอง
// - ปุ่มกล้องมุมขวาล่าง = เลือกไฟล์ แล้วตัดจัตุรัสกลาง + ย่อ 256px +
//   อัปโหลดทันที (ชุดเดียวกับ AvatarUpload บนหน้าโปรไฟล์ ไม่มี crop dialog)
// - อัปเดตเฉพาะคอลัมน์ profile_picture แล้ว invalidate my-lamb + lamb-info
//   ให้ sidebar / profile dropdown / หน้าโปรไฟล์เปลี่ยนตาม

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // ตรงกับ limit ของ bucket-seed
const AVATAR_SIZE = 256;

export function MyProfileAvatar({
  lamb,
  className,
}: {
  lamb: MyLamb;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  const queryClient = useQueryClient();

  const nickname = lamb.nick_name || lamb.first_name || "avatar";
  const initials = (lamb.nick_name || lamb.first_name || "?")
    .slice(0, 2)
    .toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP เท่านั้น");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 10MB");
      return;
    }

    setIsBusy(true);
    try {
      const resized = await cropAndResizeImage(file, AVATAR_SIZE);
      const url = await uploadAvatar({
        blob: resized,
        nickname,
        lambId: lamb.id,
        previousUrl: lamb.profile_picture,
      });
      const { error } = await supabase
        .from("lamb_info")
        .update({ profile_picture: url })
        .eq("id", lamb.id);
      if (error) throw error;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-lamb"] }),
        queryClient.invalidateQueries({ queryKey: ["lamb-info"] }),
      ]);
      toast.success("อัปเดตรูปโปรไฟล์แล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      <Link
        to="/lamb-info/$lambId"
        params={{ lambId: lamb.id }}
        aria-label="ไปหน้าโปรไฟล์ของฉัน"
        className="block size-full overflow-hidden rounded-xl border bg-muted shadow-sm transition hover:ring-4 hover:ring-primary/30 focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none"
      >
        {lamb.profile_picture ? (
          <img
            src={lamb.profile_picture}
            alt={nickname}
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-3xl font-semibold text-muted-foreground sm:text-4xl">
            {initials}
          </span>
        )}
      </Link>
      <button
        type="button"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
        aria-label="อัปโหลดรูปโปรไฟล์"
        title="อัปโหลดรูปโปรไฟล์"
        className="absolute right-1.5 bottom-1.5 flex size-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-80"
      >
        {isBusy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Camera className="size-4" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        disabled={isBusy}
        onChange={handleFileChange}
      />
    </div>
  );
}
