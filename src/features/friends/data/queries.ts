import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

// ข้อมูลการ์ด "รู้จักเพื่อน" (/friends, grill-me 2026-11-19) — เฉพาะสมาชิกที่
// ยังอยู่ (status = true) พร้อมบุคลิกภาพจากตาราง personality_type ไม่มีการ
// เปลี่ยนแปลง DB: ทุกคอลัมน์มีอยู่แล้วใน lamb_info
export type FriendLamb = Pick<
  Tables<"lamb_info">,
  | "id"
  | "first_name"
  | "last_name"
  | "nick_name"
  | "profile_picture"
  | "birthday"
  | "interesting"
  | "favorite_food"
> & {
  personality_type: Pick<
    Tables<"personality_type">,
    "code" | "description_th" | "archetype" | "explain"
  > | null;
};

export function useFriendLambs() {
  return useQuery({
    queryKey: ["friends", "lambs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select(
          "id, first_name, last_name, nick_name, profile_picture, birthday, interesting, favorite_food, personality_type(code, description_th, archetype, explain)",
        )
        .eq("status", true);

      if (error) throw error;
      return (data ?? []) as unknown as FriendLamb[];
    },
  });
}
