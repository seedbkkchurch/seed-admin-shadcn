import type { Tables } from "@/lib/supabase/database.types";

// เฝ้าเดี่ยว (personal devotion) vs คำเทศนา (sermon note) — เพิ่มโดย
// grill-me 2026-08-26. คอลัมน์ DB เป็น text + check constraint (ไม่ใช่ DB
// enum จริง) ให้ TS แคบเป็น union นี้แทน ดู migration
// add_lamb_devotion_content_type. ตารางเดิม/schema/editor/feed/table ใช้
// ร่วมกันทั้งหมด — สิ่งที่ต่างกันมีแค่ตัวเลือกนี้ กับว่าจะถูกนับใน
// ภาพรวมเฝ้าเดี่ยว/heatmap/กราฟรายเดือนไหม (นับเฉพาะ devotion เท่านั้น —
// ดู devotion-overview/data/queries.ts, devotion-section.tsx)
export type DevotionContentType = "devotion" | "sermon";

export const DEVOTION_CONTENT_TYPE_LABELS: Record<DevotionContentType, string> = {
  devotion: "เฝ้าเดี่ยว",
  sermon: "คำเทศนา",
};

export const devotionContentTypeOptions = (
  Object.entries(DEVOTION_CONTENT_TYPE_LABELS) as [DevotionContentType, string][]
).map(([value, label]) => ({ value, label }));

// Row shape from the generated Supabase schema. `is_public` is overridden
// to non-null: the DB allows NULL, but every write path in this app always
// sets it explicitly (see devotion-editor.tsx) and every read path treats
// it as a plain boolean. Left as an override rather than threading
// null-checks through every consumer — see grill-me (2026-08-12), tracked
// in the `supabase_generated_types` project memory. `content_type` is
// narrowed the same way from the generated `string` to the union above —
// DB constraint guarantees the value, not the generated type.
export type LambDevotion = Omit<
  Tables<"lamb_devotion">,
  "is_public" | "content_type"
> & {
  is_public: boolean;
  content_type: DevotionContentType;
};

// Feed/detail queries embed the submitting lamb's name via Supabase's
// nested-select syntax (lamb_info(...)). Same first_name/last_name
// non-null override as LambInfo (see data/schema.ts) — DB allows NULL,
// app has always assumed non-null here.
export type LambDevotionRow = LambDevotion & {
  lamb_info:
    | (Pick<Tables<"lamb_info">, "nick_name" | "profile_picture"> & {
        first_name: string;
        last_name: string;
      })
    | null;
};

export function lambDisplayName(lamb: {
  nick_name: string | null;
  first_name: string;
  last_name: string;
}): string {
  const fullName = [lamb.first_name, lamb.last_name].filter(Boolean).join(" ");
  return lamb.nick_name ? `${lamb.nick_name} (${fullName})` : fullName;
}

// Row shape from the `public_devotion_feed` DB view — NOT the same as
// LambDevotionRow. This view exists specifically so the public /devotion,
// /devotion/$devotionId pages (no login) never touch lamb_devotion/lamb_info
// directly: those tables have RLS that only allows the `authenticated` role,
// and lamb_info holds sensitive columns (address/phone/email/birthday/
// remark) that must never reach an anon client. The view pre-filters
// is_public=true and pre-joins only nick/first/last name + profile_picture
// (flat columns, not a nested lamb_info object — a view has no FK
// relationship for PostgREST to embed through). profile_picture was added
// alongside the name columns (not treated as sensitive, unlike
// address/phone/email/birthday — grill-me 2026-08-24). See grill-me
// 2026-08-16 follow-up ("เข้าดูแบบไม่ login แล้วดูไม่ได้" — RLS was turned on
// after this feature was first built, project memory `rbac_design` was
// stale) and the view's own DB comment (migration
// public_devotion_feed_view_for_anon_share,
// public_devotion_feed_add_profile_picture).
export type PublicDevotionFeedEntry = {
  id: string;
  title: string;
  content_html: string;
  image_urls: string[];
  devotion_date: string;
  created_at: string;
  content_type: DevotionContentType;
  lamb_nick_name: string | null;
  lamb_first_name: string | null;
  lamb_last_name: string | null;
  lamb_profile_picture: string | null;
};
