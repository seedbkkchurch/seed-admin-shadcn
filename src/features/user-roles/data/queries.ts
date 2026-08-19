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
