import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { type LambOption, type RoleRow, type UserRoleRow } from "./schema";

const userRoleKeys = {
  roles: ["user-roles", "roles"] as const,
  assignments: ["user-roles", "assignments"] as const,
  lambOptions: ["user-roles", "lamb-options"] as const,
  // Not a list query — count of user_roles rows referencing a given role
  // code, used by the delete-role dialog to pre-check FK usage before
  // attempting delete (user_roles_role_fkey has ON DELETE NO ACTION, so an
  // in-use role would otherwise fail with a raw Postgres FK error — see
  // grill-me 2026-08-15).
  roleUsage: (code: string) => ["user-roles", "role-usage", code] as const,
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

// Count of user_roles rows currently referencing this role code — queried
// on-demand (enabled: open) by the delete dialog, not kept in the list
// query, since it's only needed right before a delete attempt.
export function useRoleUsageCount(code: string, enabled: boolean) {
  return useQuery({
    queryKey: userRoleKeys.roleUsage(code),
    enabled,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("user_roles")
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

// --- lamb options (for the Assignments combobox) -----------------------

export function useLambOptions() {
  return useQuery({
    queryKey: userRoleKeys.lambOptions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_directory")
        .select("id, first_name, last_name, nick_name")
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data as LambOption[];
    },
  });
}

// --- user_roles (assignments) -------------------------------------------

export function useAssignmentsList() {
  return useQuery({
    queryKey: userRoleKeys.assignments,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, lamb_id, role, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserRoleRow[];
    },
  });
}

type AssignmentInput = Pick<TablesInsert<"user_roles">, "lamb_id" | "role">;

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: AssignmentInput) => {
      const { data, error } = await supabase
        .from("user_roles")
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userRoleKeys.assignments });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: AssignmentInput;
    }) => {
      const { data, error } = await supabase
        .from("user_roles")
        .update(values)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userRoleKeys.assignments });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userRoleKeys.assignments });
    },
  });
}

// --- current user's super_admin check (route guard) ---------------------

// Standalone helper (not a hook) so the route's `beforeLoad` — which runs
// outside React and can't call hooks — can await it directly. Mirrors
// auth_lamb_id()'s definition (lamb_info.auth_user_id = auth.uid()) plus a
// user_roles lookup for role='super_admin', client-side, since RPC-calling
// the SQL helpers isn't set up for anonymous/pre-render use here and this
// only needs a boolean.
export async function checkIsSuperAdmin(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Hardcoded bypass for one staff account whose synthetic lamb_info row
  // was deleted outside of tracked migrations (see grill-me 2026-08-15) —
  // by explicit decision we never recreate a fake lamb_info row to work
  // around this, so this account can't go through the normal
  // lamb_info -> user_roles path below. Frontend convenience only; the
  // actual security boundary is the same UUID hardcoded in the RLS
  // migration rbac_super_admin_hardcoded_bypass, so a user cannot forge
  // access just by setting this env var themselves.
  if (
    import.meta.env.VITE_SUPER_ADMIN_UID &&
    user.id === import.meta.env.VITE_SUPER_ADMIN_UID
  ) {
    return true;
  }

  const { data: lamb, error: lambError } = await supabase
    .from("lamb_info")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (lambError || !lamb) return false;

  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("id")
    .eq("lamb_id", lamb.id)
    .eq("role", "super_admin")
    .maybeSingle();
  if (roleError) return false;

  return !!role;
}
