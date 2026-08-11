// Row shape of the real `lamb_devotion` table — see
// docs/devotion-db-design.md for the schema/SQL this matches (table is
// assumed to already exist in Supabase; this app never creates it).
export type LambDevotion = {
  id: string
  lamb_id: string
  // yyyy-MM-dd
  devotion_date: string
  title: string
  content_html: string
  image_urls: string[]
  created_at: string
  updated_at: string
  // Controls whether the entry shows up in the public เฝ้าเดี่ยว feed
  // (devotion-feed.tsx). false = only visible via the admin test table
  // (devotion-table.tsx) — see grill-me follow-up 2026-08-09.
  is_public: boolean
}

// Feed/detail queries embed the submitting lamb's name via Supabase's
// nested-select syntax (lamb_info(...)).
export type LambDevotionRow = LambDevotion & {
  lamb_info: {
    nick_name: string | null
    first_name: string
    last_name: string
  } | null
}

export function lambDisplayName(lamb: {
  nick_name: string | null
  first_name: string
  last_name: string
}): string {
  const fullName = [lamb.first_name, lamb.last_name].filter(Boolean).join(' ')
  return lamb.nick_name ? `${lamb.nick_name} (${fullName})` : fullName
}
