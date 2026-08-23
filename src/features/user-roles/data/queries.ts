import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { type LambRoleRow, type RoleRow } from "./schema";

const userRoleKeys = {
  roles: ["user-roles", "roles"] as const,
  lambRoles: ["user-roles", "lamb-roles"] as const,
  // Not a list query — count of lamb_info rows currently holding a given
  // role code, used by the delete-role dialog to pre-check FK usage before
  // attempting delete (lamb_info_role_fkey has ON DELETE NO ACTION, so an
  // in-use role would otherwise fail with a raw Postgres FK error — see
  // grill-me 2026-08-15, still applies after the 2026-08-17 redesign).
  roleUsage: (code: string) => ["user-roles", "role-usage", code] as const,
  isSuperAdmin: ["user-roles", "is-super-admin"] as const,
};

// --- roles (dictionary) -----------------------------------------------

export function useRolesList() {
  return useQuery({
    queryKey: userRoleKeys.roles,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("code, name_th, sort_order")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as RoleRow[];
    },
  });
}

type RoleInput = RoleRow;

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: RoleInput) => {
      const { data, error } = await supabase
        .from("roles")
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userRoleKeys.roles });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      code,
      values,
    }: {
      code: string;
      values: Omit<RoleInput, "code">;
    }) => {
      const { data, error } = await supabase
        .from("roles")
        .update(values)
        .eq("code", code)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userRoleKeys.roles });
    },
  });
}

// Count of lamb_info rows currently holding this role code — queried
// on-demand (enabled: open) by the delete dialog, not kept in the list
// query, since it's only needed right before a delete attempt.
export function useRoleUsageCount(code: string, enabled: boolean) {
  return useQuery({
    queryKey: userRoleKeys.roleUsage(code),
    enabled,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("lamb_info")
        .select("id", { count: "exact", head: true })
        .eq("role", code);

      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.from("roles").delete().eq("code", code);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userRoleKeys.roles });
    },
  });
}

// --- lamb ↔ role (was user_roles, now a column on lamb_info) -----------

// Every lamb, regardless of status, so a leader who's been marked inactive
// still shows up here and can have their role corrected/cleared. Reads
// straight from lamb_info (not the lamb_directory view, which excludes
// both `status` and the new `role` column) — RLS SELECT on lamb_info is
// open to any authenticated user already.
export function useLambRolesList() {
  return useQuery({
    queryKey: userRoleKeys.lambRoles,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select("id, first_name, last_name, nick_name, role")
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data as LambRoleRow[];
    },
  });
}

// Inline-edit save: one lamb, one new role code. The DB enforces who's
// actually allowed to do this (trg_lamb_info_guard_role_change — only
// super_admin/hardcoded bypass can change `role`; everyone else gets a
// Postgres permission-denied error surfaced via the mutation's onError
// toast), so there's no separate client-side permission check here.
export function useUpdateLambRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { data, error } = await supabase
        .from("lamb_info")
        .update({ role })
        .eq("id", id)
        .select("id, first_name, last_name, nick_name, role")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userRoleKeys.lambRoles });
    },
  });
}

// --- current user's super_admin check (route guard) ---------------------

// Standalone helper (not a hook) so the route's `beforeLoad` — which runs
// outside React and can't call hooks — can await it directly. Mirrors the
// SQL helper auth_is_super_admin() (hardcoded staff bypass OR
// lamb_info.role = 'super_admin' for the caller's linked lamb), done
// client-side since RPC-calling the SQL helper isn't set up for
// anonymous/pre-render use here and this only needs a boolean.
export async function checkIsSuperAdmin(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Hardcoded bypass for staff accounts with no lamb_info row (see
  // grill-me 2026-08-15 / 2026-08-17) — by explicit decision we never
  // create a fake lamb_info row to work around this, so these accounts
  // can't go through the normal lamb_info.role path below. Frontend
  // convenience only; the actual security boundary is the same UUID
  // hardcoded in SQL (auth_is_hardcoded_super_admin(), used by
  // auth_is_super_admin() and the role-change trigger), so a user cannot
  // forge access just by setting this env var themselves.
  if (
    import.meta.env.VITE_SUPER_ADMIN_UID &&
    user.id === import.meta.env.VITE_SUPER_ADMIN_UID
  ) {
    return true;
  }

  const { data: lamb, error: lambError } = await supabase
    .from("lamb_info")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (lambError || !lamb) return false;

  return lamb.role === "super_admin";
}

// Reactive version of checkIsSuperAdmin() สำหรับใช้ใน component ทั่วไป (เช่น
// ซ่อน/โชว์กลุ่มเมนู Admin ใน sidebar และ Cmd+K search — ดู
// useVisibleNavGroups ใน components/layout/data/use-visible-nav-groups.ts)
// ต่างจาก checkIsSuperAdmin() ตรงที่นี่เป็น hook ครอบด้วย useQuery ให้ cache
// ผลไว้ในเซสชันเดียวกัน ไม่ต้องยิง query ซ้ำทุกครั้งที่ sidebar re-render —
// ตกลงใน grill-me 2026-08-18. staleTime 5 นาทีเพราะ role ไม่ได้เปลี่ยนบ่อย
// ระหว่างใช้งานอยู่ (ถ้าแอดมินเปลี่ยน role ให้ใครกลางทาง คนนั้นจะเห็นเมนู
// อัปเดตภายใน 5 นาที หรือทันทีถ้า refresh หน้า)
export function useIsSuperAdmin() {
  return useQuery({
    queryKey: userRoleKeys.isSuperAdmin,
    queryFn: checkIsSuperAdmin,
    staleTime: 5 * 60 * 1000,
  });
}

// --- current user's role + lamb id (route guard: member/visitor scope) --

// role ที่ถือว่า "จำกัดสิทธิ์" — ดูรายชื่อลูกแกะหลายคน (Lamb Info list) หรือ
// เมนูคุมงานกลุ่มแคร์ (เช็คชื่อรายสัปดาห์) ไม่ได้ ดูได้แค่ profile ตัวเอง —
// ตกลงใน grill-me 2026-08-23 ("สมาชิกไม่เห็น menu เช็คชื่อและ lamb-info ที่มี
// หลายคน สิทธิไม่ถึง จะดูได้แค่ profile ของตัวเองเท่านั้น")
const LAMB_ACCESS_RESTRICTED_ROLES = new Set(["member", "visitor"]);

type MyLambRoleInfo = { lambId: string | null; role: string | null };

// Standalone helper (ไม่ใช่ hook) เหมือน checkIsSuperAdmin ด้านบน — ให้
// route beforeLoad เรียกตรงๆ ได้ (อยู่นอก React เรียก hook ไม่ได้) คืนทั้ง
// lambId และ role มาในคราวเดียวกันเพื่อไม่ต้อง query lamb_info ซ้ำสองรอบ
// (route guard ของ /lamb-info/$lambId ต้องใช้ทั้งคู่ — role เพื่อเช็คว่า
// จำกัดสิทธิ์ไหม, lambId เพื่อเทียบว่า params.lambId ตรงกับของตัวเองไหม)
// role/lambId หาไม่เจอ (ไม่มี user, ไม่มีแถว lamb_info ผูกอยู่) ถือเป็น
// null ทั้งคู่ — ฝั่งเรียกใช้ต้อง treat เป็น "จำกัดสิทธิ์" (default-deny)
// ไม่ใช่ปล่อยผ่าน (ดู checkIsLambAccessRestricted / checkCanAccessLambProfile
// ด้านล่าง)
async function getMyLambRoleInfo(): Promise<MyLambRoleInfo> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { lambId: null, role: null };

  // staff super_admin ที่ไม่มีแถว lamb_info ผูกอยู่ (เหมือน
  // checkIsSuperAdmin ด้านบน) — ไม่มีทางถูก "จำกัดสิทธิ์" อยู่แล้วเพราะ
  // super_admin ไม่อยู่ใน LAMB_ACCESS_RESTRICTED_ROLES แต่คืน lambId เป็น
  // null เพราะ account นี้ไม่มีลูกแกะผูกจริง
  if (
    import.meta.env.VITE_SUPER_ADMIN_UID &&
    user.id === import.meta.env.VITE_SUPER_ADMIN_UID
  ) {
    return { lambId: null, role: "super_admin" };
  }

  const { data: lamb, error } = await supabase
    .from("lamb_info")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (error || !lamb) return { lambId: null, role: null };

  return { lambId: lamb.id, role: lamb.role };
}

// ใช้กันหน้ารายการ/เมนูคุมงานกลุ่ม (Lamb Info list, เช็คชื่อรายสัปดาห์) —
// true = จำกัดสิทธิ์ (member/visitor หรือหา role ไม่เจอเลย)
export async function checkIsLambAccessRestricted(): Promise<boolean> {
  const { role } = await getMyLambRoleInfo();
  return role === null || LAMB_ACCESS_RESTRICTED_ROLES.has(role);
}

// ใช้กันหน้าโปรไฟล์ลูกแกะรายตัว (/lamb-info/$lambId) — member/visitor ดูได้
// เฉพาะ lambId ของตัวเอง คนอื่น (admin/team_leader/cell_leader/super_admin)
// ดูได้ทุก lambId เหมือนเดิม
export async function checkCanAccessLambProfile(
  lambId: string,
): Promise<boolean> {
  const { lambId: myLambId, role } = await getMyLambRoleInfo();
  if (role === null) return false;
  if (!LAMB_ACCESS_RESTRICTED_ROLES.has(role)) return true;
  return myLambId === lambId;
}
