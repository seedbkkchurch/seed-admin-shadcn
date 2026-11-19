import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/lib/supabase/database.types";

// เพลงพื้นหลังตอนอ่านพระคัมภีร์ (grill-me 2026-11-19/20) — วิดีโอ YouTube ใน
// หน้า /bible-music ตัวเล่น (BibleMusicPlayer) อ่านเฉพาะเพลงที่ is_active
// สิทธิ์ (RLS, grill-me 2026-11-20 รอบสอง):
//   - ทุกคนที่ล็อกอินอ่านรายการได้
//   - music:add (ทุก role ยกเว้น visitor) เพิ่มเพลงได้ — added_by ต้องเป็น
//     lamb ของตัวเอง (DB ใส่ default auth_lamb_id() ให้) ขึ้นตัวเล่นทันที
//   - music:manage (admin, super_admin) ลบ/เปิดปิด/เรียงลำดับได้ — สมาชิก
//     แก้หรือลบเพลงที่ตัวเองเพิ่มไม่ได้
//   ปรับ role ได้จากหน้า /permissions
export type BibleMusicAdder = Pick<
  Tables<"lamb_info">,
  "nick_name" | "first_name" | "last_name" | "profile_picture"
>;

export type BibleMusicTrack = Tables<"bible_music_track"> & {
  adder: BibleMusicAdder | null;
};

const TRACK_SELECT =
  "*, adder:added_by(nick_name, first_name, last_name, profile_picture)";

const keys = {
  all: ["bible-music"] as const,
  list: (activeOnly: boolean) => ["bible-music", { activeOnly }] as const,
  permission: (perm: string) => ["bible-music", "permission", perm] as const,
};

// --- สิทธิ์ (music:add / music:manage) -------------------------------------
// เรียก auth_has_permission (RPC) แบบเดียวกับ checkCanWriteNews — ใช้แค่
// โชว์/ซ่อน UI ตัวกันจริงคือ RLS ของ bible_music_track
type MusicPermission = "music:add" | "music:manage";

async function checkMusicPermission(perm: MusicPermission): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase.rpc("auth_has_permission", { perm });
  if (error) return false;
  return data === true;
}

function useMusicPermission(perm: MusicPermission) {
  return useQuery({
    queryKey: keys.permission(perm),
    queryFn: () => checkMusicPermission(perm),
    staleTime: 5 * 60 * 1000,
  });
}

export const useCanAddBibleMusic = () => useMusicPermission("music:add");
export const useCanManageBibleMusic = () => useMusicPermission("music:manage");

export function useBibleMusicTracks({
  activeOnly = false,
  enabled = true,
}: { activeOnly?: boolean; enabled?: boolean } = {}) {
  return useQuery({
    queryKey: keys.list(activeOnly),
    enabled,
    queryFn: async () => {
      let query = supabase
        .from("bible_music_track")
        .select(TRACK_SELECT)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as BibleMusicTrack[];
    },
  });
}

export function useAddBibleMusicTrack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (track: TablesInsert<"bible_music_track">) => {
      const { error } = await supabase.from("bible_music_track").insert(track);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateBibleMusicTrack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: Partial<Tables<"bible_music_track">> & { id: string }) => {
      const { error } = await supabase
        .from("bible_music_track")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

// สลับลำดับ 2 เพลง (ปุ่มขึ้น/ลง) — อัปเดต sort_order ทั้งคู่
export function useSwapBibleMusicOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      a,
      b,
    }: {
      a: { id: string; sort_order: number };
      b: { id: string; sort_order: number };
    }) => {
      const results = await Promise.all([
        supabase
          .from("bible_music_track")
          .update({ sort_order: b.sort_order })
          .eq("id", a.id),
        supabase
          .from("bible_music_track")
          .update({ sort_order: a.sort_order })
          .eq("id", b.id),
      ]);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeleteBibleMusicTrack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bible_music_track")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}
