import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { type LambDevotion, type LambDevotionRow } from "./devotion-schema";
import { type GiftFromGodRow, type GiftScores } from "./gifts";
import { type LambInfo, type LambInfoRow } from "./schema";

const lambInfoKeys = {
  list: ["lamb-info"] as const,
  detail: (id: string) => ["lamb-info", id] as const,
};
const groupCareKeys = {
  list: ["group-care"] as const,
};
const personalityTypeKeys = {
  list: ["personality-type"] as const,
};
const giftFromGodKeys = {
  detail: (lambId: string) => ["gift-from-god", lambId] as const,
};
const lambDevotionKeys = {
  // Root key — invalidate this to cover feed/table/detail/history at once
  // (they all nest under it), rather than juggling exact sub-keys on every
  // mutation.
  all: ["lamb-devotion"] as const,
  feed: ["lamb-devotion", "feed"] as const,
  detail: (id: string) => ["lamb-devotion", id] as const,
  history: (lambId: string) => ["lamb-devotion", "history", lambId] as const,
};

export function useLambInfoList() {
  return useQuery({
    queryKey: lambInfoKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select(
          "*, group_care_info:group_care(id, name), personality_type(code, description_en, description_th, explain, archetype)",
        )
        .order("status", { ascending: false })
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data as LambInfoRow[];
    },
  });
}

export function useLambInfoDetail(id: string | undefined) {
  return useQuery({
    queryKey: lambInfoKeys.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select(
          "*, group_care_info:group_care(id, name), personality_type(code, description_en, description_th, explain, archetype)",
        )
        .eq("id", id as string)
        .single();

      if (error) throw error;
      return data as LambInfoRow;
    },
  });
}

export function useGroupCareOptions() {
  return useQuery({
    queryKey: groupCareKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_care")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function usePersonalityTypeOptions() {
  return useQuery({
    queryKey: personalityTypeKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personality_type")
        .select("code, description_en, description_th, explain, archetype")
        .order("code", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// Mirrors `TablesInsert<"lamb_info">` (generated from the DB schema) — all
// fields optional/nullable, matching the real Insert/Update shape. Used
// for both create and update payloads; the create/edit form intentionally
// omits lamb_lesson_ch18_progress/lamb_lesson_life_progress (see
// data/schema.ts LambInfo doc comment), which this type allows.
type LambInfoInput = TablesInsert<"lamb_info">;

export function useCreateLambInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: LambInfoInput) => {
      const { data, error } = await supabase
        .from("lamb_info")
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lambInfoKeys.list });
    },
  });
}

export function useUpdateLambInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: LambInfoInput;
    }) => {
      const { data, error } = await supabase
        .from("lamb_info")
        .update(values)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lambInfoKeys.list });
    },
  });
}

export function useDeleteLambInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lamb_info").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lambInfoKeys.list });
    },
  });
}

// `gift_from_god` has at most one row per lamb (lamb_id is the PK). A lamb
// with no assessment yet simply has no row — that's expected, not an
// error, and callers should treat a null result as all-zero scores
// (see mergeGiftScores in ./gifts).
export function useGiftFromGod(lambId: string | undefined) {
  return useQuery({
    queryKey: giftFromGodKeys.detail(lambId ?? ""),
    enabled: !!lambId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_from_god")
        .select("*")
        .eq("lamb_id", lambId as string)
        .maybeSingle();

      if (error) throw error;
      return data as GiftFromGodRow | null;
    },
  });
}

export function useUpsertGiftFromGod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lambId,
      values,
    }: {
      lambId: string;
      values: GiftScores;
    }) => {
      const { data, error } = await supabase
        .from("gift_from_god")
        .upsert({ lamb_id: lambId, ...values }, { onConflict: "lamb_id" })
        .select()
        .single();

      if (error) throw error;
      return data as GiftFromGodRow;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: giftFromGodKeys.detail(variables.lambId),
      });
    },
  });
}

// Lightweight lamb list for the "select which lamb this is for" test
// dropdown on devotion-editor.tsx — id + name fields only, no group/gift
// joins (unlike useLambInfoList, which the table page needs).
export function useLambNameOptions() {
  return useQuery({
    queryKey: [...lambInfoKeys.list, "name-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select("id, nick_name, first_name, last_name")
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data as Pick<
        LambInfo,
        "id" | "nick_name" | "first_name" | "last_name"
      >[];
    },
  });
}

export function useLambDevotionFeed() {
  return useQuery({
    queryKey: lambDevotionKeys.feed,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_devotion")
        .select("*, lamb_info(nick_name, first_name, last_name)")
        .eq("is_public", true)
        .order("devotion_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LambDevotionRow[];
    },
  });
}

// Everything, public and private — backs the admin/test table
// (devotion-table.tsx), unlike useLambDevotionFeed which only shows
// is_public rows. Optional `lambId` scopes it to one lamb — backs the
// per-lamb full-history table (lamb-devotion-table.tsx) opened via
// "ดูทั้งหมด" on the profile page, per grill-me follow-up (2026-08-11).
// Still joins lamb_info (redundant when scoped to one lamb, but keeps the
// row type — and every downstream component built on it, e.g. bulk
// delete/row actions — identical between both tables).
export function useLambDevotionTable(lambId?: string) {
  return useQuery({
    queryKey: lambId
      ? [...lambDevotionKeys.feed, "all", lambId]
      : [...lambDevotionKeys.feed, "all"],
    queryFn: async () => {
      let query = supabase
        .from("lamb_devotion")
        .select("*, lamb_info(nick_name, first_name, last_name)")
        .order("devotion_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (lambId) query = query.eq("lamb_id", lambId);

      const { data, error } = await query;
      if (error) throw error;
      return data as LambDevotionRow[];
    },
  });
}

export function useDeleteLambDevotions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("lamb_devotion")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lambDevotionKeys.all });
    },
  });
}

export function useLambDevotionDetail(id: string | undefined) {
  return useQuery({
    queryKey: lambDevotionKeys.detail(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_devotion")
        .select("*, lamb_info(nick_name, first_name, last_name)")
        .eq("id", id as string)
        .single();

      if (error) throw error;
      return data as LambDevotionRow;
    },
  });
}

// Full submission history for one lamb (all lamb_devotion rows, public
// and private alike) — backs the "ประวัติเฝ้าเดี่ยว" section on their
// profile page (devotion-section.tsx). No lamb_info join needed (the lamb
// is already known from context) and no date-range filter — per
// docs/devotion-db-design.md the table stays tiny for decades even
// unfiltered, so client-side windowing (day/month/year views) is fine.
// Per grill-me follow-up (2026-08-11) — replaces the earlier
// mock-data-only version (data/devotions.ts).
export function useLambDevotionHistory(lambId: string | undefined) {
  return useQuery({
    queryKey: lambDevotionKeys.history(lambId ?? ""),
    enabled: !!lambId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_devotion")
        .select("id, devotion_date, title, content_html, image_urls, is_public")
        .eq("lamb_id", lambId as string)
        .order("devotion_date", { ascending: true });

      if (error) throw error;
      return data as Omit<
        LambDevotion,
        "lamb_id" | "created_at" | "updated_at"
      >[];
    },
  });
}

type LambDevotionInput = Omit<LambDevotion, "id" | "created_at" | "updated_at">;

// Unique-violation Postgres error code — thrown when the selected lamb
// already has an entry for `devotion_date` (see the table's
// lamb_devotion_one_per_day constraint in docs/devotion-db-design.md).
export const DEVOTION_ALREADY_SUBMITTED_CODE = "23505";

export function useCreateLambDevotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: LambDevotionInput) => {
      const { data, error } = await supabase
        .from("lamb_devotion")
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      return data as LambDevotion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lambDevotionKeys.all });
    },
  });
}

// Edit surface for the admin test table (devotion-table.tsx) and the
// detail page — per grill-me follow-up (2026-08-11), only
// title/content/status are editable; lamb_id and devotion_date are
// intentionally excluded (fixed at creation) to avoid colliding with the
// lamb_devotion_one_per_day constraint.
type LambDevotionUpdateInput = Partial<
  Pick<LambDevotion, "title" | "content_html" | "image_urls" | "is_public">
>;

export function useUpdateLambDevotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: LambDevotionUpdateInput;
    }) => {
      const { data, error } = await supabase
        .from("lamb_devotion")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as LambDevotion;
    },
    onSuccess: () => {
      // The root key covers feed/table/detail/history at once (they all
      // nest under it) — simpler and safer than juggling exact sub-keys,
      // and this mutation can affect a devotion shown across several of
      // them (test table, detail page, the lamb's own history graph).
      queryClient.invalidateQueries({ queryKey: lambDevotionKeys.all });
    },
  });
}
