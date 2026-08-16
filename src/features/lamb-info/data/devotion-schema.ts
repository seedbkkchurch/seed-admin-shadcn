import type { Tables } from "@/lib/supabase/database.types";

// Row shape from the generated Supabase schema. `is_public` is overridden
// to non-null: the DB allows NULL, but every write path in this app always
// sets it explicitly (see devotion-editor.tsx) and every read path treats
// it as a plain boolean. Left as an override rather than threading
// null-checks through every consumer — see grill-me (2026-08-12), tracked
// in the `supabase_generated_types` project memory.
export type LambDevotion = Omit<Tables<"lamb_devotion">, "is_public"> & {
  is_public: boolean;
};

// Feed/detail queries embed the submitting lamb's name via Supabase's
// nested-select syntax (lamb_info(...)). Same first_name/last_name
// non-null override as LambInfo (see data/schema.ts) — DB allows NULL,
// app has always assumed non-null here.
export type LambDevotionRow = LambDevotion & {
  lamb_info:
    | (Pick<Tables<"lamb_info">, "nick_name"> & {
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
// is_public=true and pre-joins only nick/first/last name (flat columns, not
// a nested lamb_info object — a view has no FK relationship for PostgREST to
// embed through). See grill-me 2026-08-16 follow-up ("เข้าดูแบบไม่ login
// แล้วดูไม่ได้" — RLS was turned on after this feature was first built,
// project memory `rbac_design` was stale) and the view's own DB comment
// (migration public_devotion_feed_view_for_anon_share).
export type PublicDevotionFeedEntry = {
  id: string;
  title: string;
  content_html: string;
  image_urls: string[];
  devotion_date: string;
  created_at: string;
  lamb_nick_name: string | null;
  lamb_first_name: string | null;
  lamb_last_name: string | null;
};
