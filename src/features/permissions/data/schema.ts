import type { Tables } from "@/lib/supabase/database.types";

export type RoleRow = Tables<"roles">;
export type RolePermissionRow = Tables<"role_permissions">;

// One row per distinct permission key, grouped by its domain (the part
// before the first ":", e.g. "lamb:edit:own" -> domain "lamb"). Domain is
// derived client-side by splitting the string — role_permissions has no
// separate domain column (see rbac_design project memory: 5 domains —
// lamb, group, progress, user, report — though `user:*` was explicitly
// dropped from the matrix and never got any rows).
export type PermissionKey = {
  key: string;
  domain: string;
};
