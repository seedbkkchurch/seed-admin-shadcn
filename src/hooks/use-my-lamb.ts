import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuthUser } from "./use-auth-user";

export type MyLamb = {
  id: string;
  first_name: string;
  last_name: string;
  nick_name: string | null;
  email: string | null;
};

// ลูกแกะที่ผูกกับ auth account ที่ล็อกอินอยู่ตอนนี้ (lamb_info.auth_user_id =
// auth.uid()) — ตัวกลางที่ทุกหน้า/คอมโพเนนต์ที่เคยต้อง "เลือกลูกแกะ" มือ
// (DevotionEditor, Subscribe, MobileTabBar) ควรเรียกใช้แทนการ query/hardcode
// เอง ตกลงใน grill-me 2026-08-14 รอบเจ็ด (`rbac_design` + `auth_lamb_link_design`
// ใน project memory) — ทุกลูกแกะที่มี email ถูก bulk-create auth account +
// link auth_user_id ไว้แล้ว (ดู migration `rbac_bulk_create_lamb_auth_accounts`)
// เพราะฉะนั้นปกติควรเจอเสมอ กรณี `data === null` (ไม่มีแถวผูกอยู่) เป็น edge
// case จริงๆ (เช่น staff account หรือ auth user ที่สร้างเพิ่มทีหลังไม่ผ่าน
// flow นี้) — หน้าที่เรียกใช้ต้องมี fallback UI ของตัวเอง ไม่ throw
export function useMyLamb() {
  const user = useAuthUser();

  const query = useQuery({
    queryKey: ["my-lamb", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select("id, first_name, last_name, nick_name, email")
        .eq("auth_user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as MyLamb | null;
    },
  });

  // `user` มาจาก useAuthUser ซึ่งเริ่มที่ null เสมอจนกว่า supabase.auth.getUser()
  // จะ resolve — แยก isResolvingUser ออกมาให้ผู้เรียกใช้แสดง loading state
  // ตั้งแต่ต้นได้ (ไม่ใช่แค่ query.isPending ซึ่งเป็น true ค้างตอน
  // enabled=false ด้วยเหมือนกัน แยกไม่ออกว่า "ยังไม่รู้ user" หรือ "รู้แล้วว่า
  // ไม่มี user") ทุกหน้าที่ใช้ hook นี้อยู่ใต้ _authenticated อยู่แล้ว (route
  // guard เช็ค session ให้ก่อนหน้านี้) จึงคาดว่า user จะ resolve เป็นค่าจริง
  // เร็วมาก ไม่ใช่กรณี "login ไม่อยู่จริง" ยาวนาน
  return {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    isSuccess: query.isSuccess,
    isResolvingUser: user === null,
  };
}
