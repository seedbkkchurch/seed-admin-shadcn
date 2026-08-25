import type { Tables } from "@/lib/supabase/database.types";

// Row shape from the generated Supabase schema — matches the DB exactly,
// no overrides needed (unlike LambDevotion's is_public override, see
// lamb-info/data/devotion-schema.ts) since every news column here is
// NOT NULL at the DB level except the genuinely-optional ones.
export type NewsRow = Tables<"news">;

export type NewsCategoryRow = Tables<"news_category">;

// news.author_id/updated_by embed via PostgREST nested select — only used
// on the authenticated table/detail pages (lamb_info SELECT RLS is
// authenticated-only, see queries.ts comments). Both are optional/nullable
// because updated_by starts null and author_id's embed can come back null
// if the lamb row was ever deleted (FK has no cascade).
export type NewsAuthorInfo = Pick<
  Tables<"lamb_info">,
  "nick_name" | "profile_picture"
> & {
  first_name: string;
  last_name: string;
};

export type NewsRowWithRelations = NewsRow & {
  author: NewsAuthorInfo | null;
  updated_by_lamb: NewsAuthorInfo | null;
  news_category: Pick<NewsCategoryRow, "id" | "code" | "name_th"> | null;
};

export function newsAuthorDisplayName(author: {
  nick_name: string | null;
  first_name: string;
  last_name: string;
}): string {
  const fullName = [author.first_name, author.last_name]
    .filter(Boolean)
    .join(" ");
  return author.nick_name ? `${author.nick_name} (${fullName})` : fullName;
}

// Row shape from the `public_news_feed` DB view — เหมือน
// PublicDevotionFeedEntry ทุกประการ (ดู lamb-info/data/devotion-schema.ts):
// view นี้กรอง status='published' และเลือกเฉพาะคอลัมน์ปลอดภัยของผู้เขียน
// (flat columns, ไม่ใช่ nested object — view ไม่มี FK ให้ PostgREST embed)
// backs /news, /news/$slug (features/news-public/) ที่ไม่ต้อง login
export type PublicNewsFeedEntry = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_html: string;
  cover_image_url: string | null;
  image_urls: string[];
  published_at: string | null;
  created_at: string;
  category_name: string | null;
  author_nick_name: string | null;
  author_first_name: string | null;
  author_last_name: string | null;
  author_profile_picture: string | null;
};

export const NEWS_STATUS_LABELS: Record<string, string> = {
  draft: "ร่าง",
  published: "เผยแพร่แล้ว",
  archived: "เก็บถาวรแล้ว",
};

export const newsStatusFilterOptions = [
  { label: "ร่าง", value: "draft" },
  { label: "เผยแพร่แล้ว", value: "published" },
  { label: "เก็บถาวรแล้ว", value: "archived" },
];
