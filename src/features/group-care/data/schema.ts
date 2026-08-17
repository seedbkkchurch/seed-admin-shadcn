import type { Tables } from "@/lib/supabase/database.types";

export type GroupCareRow = Tables<"group_care">;

// Minimal lamb_info projection used to render a group's member roster
// (see useGroupCareMembers in data/queries.ts). first_name/last_name
// overridden to non-null — DB allows NULL, app has always assumed
// non-null here (see grill-me 2026-08-12, `supabase_generated_types`
// project memory). `role` (cell_leader/team_leader = leader of their
// assigned group_care) replaces the old is_leader_group_care boolean —
// see grill-me 2026-08-12, `group_care_leader` project memory for why
// this reuses lamb_info instead of a field on group_care itself, and
// rbac_lamb_role_redesign (2026-08-17) for the boolean -> role move.
export type GroupCareMember = Pick<
  Tables<"lamb_info">,
  "id" | "nick_name" | "profile_picture" | "group_care" | "role"
> & {
  first_name: string;
  last_name: string;
};

// GroupCareRow augmented, client-side, with the members assigned to it,
// and the subset of those members who are leaders — built in index.tsx by
// grouping useGroupCareMembers() output per group_care.id and handed down
// to the table/columns/dialogs.
export type GroupCareRowWithMembers = GroupCareRow & {
  members: GroupCareMember[];
  leaders: GroupCareMember[];
};
