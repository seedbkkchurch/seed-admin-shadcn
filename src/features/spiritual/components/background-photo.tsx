import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PexelsPhoto } from "@/features/lamb-info/data/pexels";

// รูปพื้นหลังของการ์ดบนหน้าจิตวิญญาณของฉัน — เฟดเข้าเมื่อโหลดเสร็จ ทับด้วยชั้น
// มืดให้ตัวอักษรขาวอ่านออกทุกรูป วางเป็นลูกคนแรกของ <section class="relative
// overflow-hidden"> (ใช้ร่วมการ์ดข้อพระคัมภีร์ประจำวันกับวันนี้ในอดีต)
export function BackgroundPhoto({
  photo,
  overlayClassName = "bg-linear-to-t from-black/75 via-black/50 to-black/40",
}: {
  photo: PexelsPhoto;
  overlayClassName?: string;
}) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  return (
    <>
      <img
        src={photo.imageUrl}
        alt=""
        onLoad={() => setLoadedUrl(photo.imageUrl)}
        className={cn(
          "absolute inset-0 size-full object-cover transition-opacity duration-700",
          loadedUrl === photo.imageUrl ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden="true"
        className={cn("absolute inset-0", overlayClassName)}
      />
    </>
  );
}
