import { resizeForArticle } from "@/lib/image-resize";
import { supabase } from "./client";

// Same bucket-seed bucket as devotion/avatar images (see devotion-image.ts)
// under its own "news"/"news-cover" folder prefixes — ตกลงใน grill-me
// 2026-08-25 ให้แยกโฟลเดอร์สำหรับข่าวแทนที่จะสร้าง bucket ใหม่ (ต้องเพิ่ม
// "news"/"news-cover" เข้า whitelist ของ storage policy ด้วย — ดู migration
// news_feature_storage_folder). ข่าวเป็น public เสมอ (ไม่มี toggle
// public/private แบบเฝ้าเดี่ยว) จึงใช้แค่ folder public/ เท่านั้น
const NEWS_BUCKET = "bucket-seed";
const NEWS_CONTENT_PREFIX = "public/seedbkk/news";
const NEWS_COVER_PREFIX = "public/seedbkk/news-cover";

async function uploadResized(file: File | Blob, prefix: string): Promise<string> {
  const resized = await resizeForArticle(file);
  const path = `${prefix}/${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(NEWS_BUCKET)
    .upload(path, resized, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(NEWS_BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * Resizes (max 1600px, JPEG q0.8 — same as devotion) and uploads an inline
 * ข่าว article image, returning its public URL. Used by ArticleEditor via
 * NewsEditor/NewsEditForm (news-editor.tsx).
 */
export async function uploadNewsImage(file: File | Blob): Promise<string> {
  return uploadResized(file, NEWS_CONTENT_PREFIX);
}

/**
 * Same resize/upload, separate folder — for the cover image field (shown
 * on card lists/thumbnails, distinct from images inserted in the article
 * body). Kept as its own function so cover vs content images stay in
 * separate storage folders for easier auditing/cleanup, mirroring
 * devotion-image.ts's public/private split.
 */
export async function uploadNewsCoverImage(file: File | Blob): Promise<string> {
  return uploadResized(file, NEWS_COVER_PREFIX);
}
