import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { type PermissionKey, type RolePermissionRow, type RoleRow } from "./schema";

const permissionKeys = {
  roles: ["permissions", "roles"] as const,
  matrix: ["permissions", "matrix"] as const,
};

export function useRolesList() {
  return useQuery({
    queryKey: permissionKeys.roles,
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

// All (role, permission) rows — used both to render the checked cells and
// to derive the distinct permission list (grouped by domain) that becomes
// the matrix's rows. A permission key only shows up here if at least one
// role currently holds it — this page edits the existing matrix, it
// doesn't let you invent a brand-new permission string no code checks for.
export function usePermissionMatrix() {
  return useQuery({
    queryKey: permissionKeys.matrix,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role, permission")
        .order("permission", { ascending: true });

      if (error) throw error;
      return data as RolePermissionRow[];
    },
  });
}

export function derivePermissionKeys(rows: RolePermissionRow[]): PermissionKey[] {
  const seen = new Map<string, PermissionKey>();
  for (const row of rows) {
    if (seen.has(row.permission)) continue;
    seen.set(row.permission, {
      key: row.permission,
      domain: row.permission.split(":")[0] ?? row.permission,
    });
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.key.localeCompare(b.key),
  );
}

// Toggle one (role, permission) cell — insert if turning on, delete if
// turning off. The DB enforces who's allowed (role_permissions_super_admin
// write policies, see grill-me 2026-08-17 follow-up), so a non-super_admin
// caller gets a Postgres RLS-denied error back here, surfaced as a toast.
export function useToggleRolePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      role,
      permission,
      grant,
    }: {
      role: string;
      permission: string;
      grant: boolean;
    }) => {
      if (grant) {
        const { error } = await supabase
          .from("role_permissions")
          .insert({ role, permission });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role", role)
          .eq("permission", permission);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.matrix });
    },
  });
}
