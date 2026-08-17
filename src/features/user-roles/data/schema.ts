import type { Tables } from "@/lib/supabase/database.types";

export type RoleRow = Tables<"roles">;

// Grill-me 2026-08-17: role is now a plain column on lamb_info (no more
// user_roles junction table — see rbac_lamb_role_redesign project memory).
// This is the minimal lamb_info projection the Assignments tab needs: who
// they are + their current role code.
export type LambRoleRow = {
  id: string;
  first_name: string;
  last_name: string;
  nick_name: string | null;
  role: string;
};
