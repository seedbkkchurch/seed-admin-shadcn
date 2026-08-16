import type { Tables } from "@/lib/supabase/database.types";

export type RoleRow = Tables<"roles">;
export type UserRoleRow = Tables<"user_roles">;

// Minimal lamb_directory projection used to populate the lamb combobox on
// the Assignments tab and to render a human name instead of a raw lamb_id.
// id/first_name/last_name overridden to non-null (the view's generated
// types allow null on all columns, but every row queried here always has
// them) — same convention as GroupCareMember (see
// features/group-care/data/schema.ts, grill-me 2026-08-12
// `supabase_generated_types` project memory).
export type LambOption = Pick<Tables<"lamb_directory">, "nick_name"> & {
  id: string;
  first_name: string;
  last_name: string;
};

// UserRoleRow augmented client-side with the assigned lamb's display info
// and the role's Thai name — built in index.tsx by joining
// useAssignmentsList() output against useLambOptions() and useRolesList(),
// same client-side-join pattern as GroupCareRowWithMembers.
export type AssignmentRow = UserRoleRow & {
  lamb: LambOption | null;
  roleName: string | null;
};
