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
