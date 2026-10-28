import { useQuery } from "@tanstack/react-query";
import { supabase } from "./client";

// รูปคนในแท็บ "รายชื่อแอนดรู" (grill-me 2026-10-28) — เป็นรูปของคนภายนอกที่
// ไม่ได้ยินยอม จึงแยกไว้ใน bucket private จริง (ไม่ใช่ bucket-seed ที่ public
// ทั้ง bucket) RLS ให้เฉพาะเจ้าของ: path ต้องขึ้นต้นด้วย auth_lamb_id()
// ดู docs/prayer-list-db-design.md ข้อ 3.3
const PRAYER_PHOTO_BUCKET = "prayer-private";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function prayerPhotoPath(lambId: string, requestId: string): string {
  return `${lambId}/${requestId}.jpg`;
}

/** อัปโหลดรูป (ครอป/ย่อมาแล้ว) ทับ path เดิมของรายการนั้น คืน storage path */
export async function uploadPrayerPhoto({
  blob,
  lambId,
  requestId,
}: {
  blob: Blob;
  lambId: string;
  requestId: string;
}): Promise<string> {
  const path = prayerPhotoPath(lambId, requestId);
  const { error } = await supabase.storage
    .from(PRAYER_PHOTO_BUCKET)
    .upload(path, blob, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: true,
    });
  if (error) throw error;
  return path;
}

export async function deletePrayerPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(PRAYER_PHOTO_BUCKET)
    .remove([path]);
  if (error) throw error;
}

// signed URL หมดอายุใน 1 ชม. — cache ไว้ 50 นาทีแล้วขอใหม่ก่อนหมดอายุ
// key รวม updatedAt ด้วย เพราะเปลี่ยนรูปแล้ว path เดิม (upsert) แต่ไฟล์ใหม่
export function usePrayerPhotoUrl(
  path: string | null | undefined,
  updatedAt?: string,
) {
  return useQuery({
    queryKey: ["prayer-photo-url", path, updatedAt],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(PRAYER_PHOTO_BUCKET)
        .createSignedUrl(path as string, SIGNED_URL_TTL_SECONDS);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
