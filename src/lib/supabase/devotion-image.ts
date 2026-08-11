import { resizeForArticle } from '@/lib/image-resize'
import { supabase } from './client'

// Shares the same bucket as avatars (see avatar.ts) under a separate
// prefix — per grill-me follow-up (2026-08-09), no need for a dedicated
// bucket for this volume of data (see docs/devotion-db-design.md).
const DEVOTION_BUCKET = 'bucket-seed'
// Bucket was reorganized into top-level public/ and private/ folders (per
// grill-me follow-up 2026-08-11). The bucket itself is still a public
// bucket end-to-end — private/ is organizational only, not access-controlled
// — but keeping public and private เฝ้าเดี่ยว images in separate folders
// mirrors the is_public flag on the row for easier auditing/cleanup.
const DEVOTION_PUBLIC_PREFIX = 'public/seedbkk/devotion'
const DEVOTION_PRIVATE_PREFIX = 'private/seedbkk/devotion'

/**
 * Resizes (max 1600px, JPEG q0.8) and uploads an inline เฝ้าเดี่ยว
 * article image, returning its public URL. Not tied to a specific lamb
 * or date — ArticleEditor can upload images before the form's lamb/date
 * selection is finalized.
 *
 * `isPublic` reflects the form's public/private toggle *at the moment the
 * image is uploaded* — per grill-me follow-up (2026-08-11), if the user
 * flips the toggle after inserting images, already-uploaded images are
 * NOT moved/re-uploaded; only images uploaded after the flip land in the
 * new folder.
 */
export async function uploadDevotionImage(
  file: File | Blob,
  isPublic: boolean
): Promise<string> {
  const resized = await resizeForArticle(file)
  const prefix = isPublic ? DEVOTION_PUBLIC_PREFIX : DEVOTION_PRIVATE_PREFIX
  const path = `${prefix}/${crypto.randomUUID()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(DEVOTION_BUCKET)
    .upload(path, resized, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from(DEVOTION_BUCKET).getPublicUrl(path)

  return publicUrl
}
