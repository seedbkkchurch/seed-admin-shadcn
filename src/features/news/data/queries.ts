import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import {
  type NewsCategoryRow,
  type NewsRow,
  type NewsRowWithRelations,
  type PublicNewsFeedEntry,
} from "./schema";

const newsKeys = {
  // Root key — invalidate this to cover feed/table/detail at once, same
  // pattern as lambDevotionKeys.all in lamb-info/data/queries.ts.
  all: ["news"] as const,
  feed: ["news", "feed"] as const,
  table: ["news", "table"] as const,
  detail: (id: string) => ["news", id] as const,
  publicFeed: ["public-news-feed"] as const,
  publicDetail: (slug: string) => ["public-news-feed", slug] as const,
  categories: ["news-category"] as const,
  canWrite: ["news", "can-write"] as const,
};

const AUTHOR_SELECT =
  "author:author_id(nick_name, first_name, last_name, profile_picture), " +
  "updated_by_lamb:updated_by(nick_name, first_name, last_name, profile_picture), " +
  "news_category(id, code, name_th)";

// --- สิทธิ์เขียนข่าว (news:write) -----------------------------------------

// Standalone helper (ไม่ใช่ hook) เหมือน checkIsSuperAdmin ใน
// user-roles/data/queries.ts — ให้ route beforeLoad เรียกตรงๆ ได้
// (auth_has_permission เป็น SQL function เช็ค role_permissions ที่ DB จริง
// อยู่แล้ว — ฝั่ง client แค่เรียก RPC มาโชว์/ซ่อน UI เท่านั้น ตัว RLS เองคือ
// ขอบเขตความปลอดภัยจริง)
export async function checkCanWriteNews(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("auth_has_permission", {
    perm: "news:write",
  });
  if (error) return false;
  return data === true;
}

export function useCanWriteNews() {
  return useQuery({
    queryKey: newsKeys.canWrite,
    queryFn: checkCanWriteNews,
    staleTime: 5 * 60 * 1000,
  });
}

// --- หมวดหมู่ข่าว (news_category) ------------------------------------------

export function useNewsCategories() {
  return useQuery({
    queryKey: newsKeys.categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_category")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as NewsCategoryRow[];
    },
  });
}

type NewsCategoryInput = TablesInsert<"news_category">;

export function useCreateNewsCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: NewsCategoryInput) => {
      const { data, error } = await supabase
        .from("news_category")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.categories });
    },
  });
}

export function useUpdateNewsCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      // code แก้ไม่ได้หลังสร้าง (ฟอร์มปิด input ไว้ตอน edit) จึงไม่บังคับส่งมา
      // ต่างจาก NewsCategoryInput ทั้งก้อนที่ code เป็น required column
      values: Partial<Pick<NewsCategoryInput, "name_th" | "sort_order">>;
    }) => {
      const { data, error } = await supabase
        .from("news_category")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.categories });
    },
  });
}

// FK เป็น ON DELETE SET NULL (ดู migration news_feature_init) — ลบหมวดหมู่
// ที่ยังมีข่าวผูกอยู่ได้เสมอ ไม่มี FK block แบบ roles/lamb_info_role_fkey
// (ข่าวแค่กลายเป็น "ไม่มีหมวดหมู่" ไม่ได้พังอะไร) จึงไม่ต้อง pre-check usage
// count ก่อนลบเหมือน useDeleteRole
export function useDeleteNewsCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("news_category")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.categories });
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
    },
  });
}

// --- ข่าว (news) — authenticated ------------------------------------------

// Published เท่านั้น — backs /_authenticated/news (news-feed.tsx), มุมมอง
// สำหรับคนที่ login แล้วเดินในแอป (ต่างจาก usePublicNewsFeed ที่ backs
// /news แบบไม่ต้อง login) ทั้งสองอันแสดงเนื้อหาเดียวกัน (published เท่านั้น)
// แค่คนละ query/คนละ chrome ของหน้า
export function useNewsFeed() {
  return useQuery({
    queryKey: newsKeys.feed,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select(`*, ${AUTHOR_SELECT}`)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as NewsRowWithRelations[];
    },
  });
}

// ทุกสถานะ (draft/published/archived) — backs หน้าจัดการข่าว
// (news-table-page.tsx) RLS เปิดให้เห็นแถวเหล่านี้เฉพาะคนมี news:write
// เท่านั้น (ดู migration) คนอื่นจะได้ list ว่างเปล่ากลับมาเฉยๆ ไม่ error
export function useNewsTable() {
  return useQuery({
    queryKey: newsKeys.table,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select(`*, ${AUTHOR_SELECT}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as NewsRowWithRelations[];
    },
  });
}

// รายละเอียดข่าว 1 ชิ้นแบบ authenticated (ทุกสถานะ ถ้า RLS อนุญาต) — backs
// /_authenticated/news/$newsId ใช้ preview ข่าว draft ก่อนเผยแพร่ได้
// (ต่างจาก usePublicNewsDetail ที่กรอง published เท่านั้นผ่าน view)
export function useNewsDetail(id: string | undefined) {
  return useQuery({
    queryKey: newsKeys.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select(`*, ${AUTHOR_SELECT}`)
        .eq("id", id as string)
        .single();

      if (error) throw error;
      return data as NewsRowWithRelations;
    },
  });
}

// --- ข่าว — public (ไม่ต้อง login) ------------------------------------------
// อ่านจาก DB view public_news_feed (security_invoker ไม่ตั้ง true จึงข้าม
// RLS ของ lamb_info/news_category ที่ anon เข้าไม่ถึงตรงๆ ได้ — ดู
// public_devotion_feed ต้นแบบใน lamb-info/data/queries.ts comment ยาว)
// view กรอง status='published' ให้แล้ว ไม่ต้องกรอง/เช็คอะไรเพิ่มฝั่ง client

export function usePublicNewsFeed() {
  return useQuery({
    queryKey: newsKeys.publicFeed,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_news_feed")
        .select("*")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as PublicNewsFeedEntry[];
    },
  });
}

// ตาม slug (ไม่ใช่ id) — URL สาธารณะเป็น /news/$slug ตามที่ตกลง
export function usePublicNewsDetail(slug: string | undefined) {
  return useQuery({
    queryKey: newsKeys.publicDetail(slug ?? ""),
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_news_feed")
        .select("*")
        .eq("slug", slug as string)
        .single();

      if (error) throw error;
      return data as PublicNewsFeedEntry;
    },
  });
}

// --- เขียน/แก้ไข/เก็บถาวร ---------------------------------------------------

// author_id/status ฝั่ง caller ต้องส่งเอง (author_id = auth_lamb_id() ของ
// ตัวเอง — RLS with_check บังคับอยู่แล้วว่าต้องตรงกับตัวเอง ดู migration)
// published_at/updated_by/updated_at ตั้งอัตโนมัติที่ DB trigger
// (trg_news_before_save) ไม่ต้องส่งมาจาก client
type NewsCreateInput = Omit<
  TablesInsert<"news">,
  "id" | "created_at" | "updated_at" | "updated_by" | "published_at"
>;

export function useCreateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: NewsCreateInput) => {
      const { data, error } = await supabase
        .from("news")
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      return data as NewsRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
      queryClient.invalidateQueries({ queryKey: newsKeys.publicFeed });
    },
  });
}

type NewsUpdateInput = Partial<
  Pick<
    TablesUpdate<"news">,
    | "title"
    | "slug"
    | "excerpt"
    | "content_html"
    | "cover_image_url"
    | "image_urls"
    | "category_id"
    | "status"
  >
>;

export function useUpdateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: NewsUpdateInput;
    }) => {
      const { data, error } = await supabase
        .from("news")
        .update(values)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as NewsRow;
    },
    onSuccess: () => {
      // root key ครอบทั้ง feed/table/detail — ปลอดภัยกว่า juggle key ย่อย
      // (mutation นี้กระทบได้หลายมุมมองพร้อมกัน เช่น เปลี่ยน status ก็ทำให้
      // ทั้ง feed และ table ต้อง refetch)
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
      queryClient.invalidateQueries({ queryKey: newsKeys.publicFeed });
    },
  });
}

// Soft delete แบบ bulk — เก็บถาวร (status='archived') ไม่ใช่ลบจริง ตกลงใน
// grill-me 2026-08-25 (ไม่มี RLS DELETE policy บน news เลย เก็บถาวรจึงเป็น
// ทางเดียวที่ "ลบ" ข่าวออกจากทุกหน้าที่แสดงผลได้จริง)
export function useArchiveNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("news")
        .update({ status: "archived" })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
      queryClient.invalidateQueries({ queryKey: newsKeys.publicFeed });
    },
  });
}
