import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuthUser } from "./use-auth-user";
import { useMyLamb } from "./use-my-lamb";

export type MyRole = {
  code: string;
  nameTh: string;
};

// Row shape returned by the embedded select below — user_roles.role is FK'd
// to roles.code so PostgREST can embed the dictionary row directly, no
// separate useRolesList() fetch needed (unlike features/user-roles/ which
// joins client-side because it also needs the full roles list for a
// dropdown — here we only ever need each role's own name).
type UserRoleWithName = {
  role: string;
  roles: { name_th: string; sort_order: number } | null;
};

// บทบาท (role) ของผู้ใช้ที่ล็อกอินอยู่ตอนนี้ — backs ProfileDropdown (โชว์
// role ใต้อีเมล) ดู grill-me 2026-08-16 "disable Setting แล้วก็ Profile
// เด้งไปหา lamb-profile ของคนๆนั้น แล้วก็บอก role ด้วย"
//
// แยกจาก useMyLamb() เพราะบางบัญชี (staff super_admin ที่ไม่มีแถว lamb_info
// ผูกอยู่ — ดู VITE_SUPER_ADMIN_UID ใน checkIsSuperAdmin,
// features/user-roles/data/queries.ts) มีบทบาทได้โดยไม่ต้องมี lamb ผูก เลย
// เช็ค bypass นี้แยกก่อน ไม่ผ่าน useMyLamb() เลย
export function useMyRoles() {
  const user = useAuthUser();
  const { data: myLamb, isResolvingUser } = useMyLamb();

  const isSuperAdminBypass =
    !!user &&
    !!import.meta.env.VITE_SUPER_ADMIN_UID &&
    user.id === import.meta.env.VITE_SUPER_ADMIN_UID;

  const query = useQuery({
    queryKey: ["my-roles", myLamb?.id],
    enabled: !!myLamb,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, roles(name_th, sort_order)")
        .eq("lamb_id", myLamb!.id);

      if (error) throw error;
      return data as UserRoleWithName[];
    },
  });

  const roles: MyRole[] = isSuperAdminBypass
    ? [{ code: "super_admin", nameTh: "ผู้ดูแลระบบสูงสุด" }]
    : (query.data ?? [])
        .filter((r) => r.roles !== null)
        .sort((a, b) => a.roles!.sort_order - b.roles!.sort_order)
        .map((r) => ({ code: r.role, nameTh: r.roles!.name_th }));

  return {
    roles,
    roleLabel: roles.length > 0 ? roles.map((r) => r.nameTh).join(", ") : null,
    isLoading: isSuperAdminBypass
      ? false
      : isResolvingUser || (!!myLamb && query.isPending),
  };
}
