import type { Tables } from "@/lib/supabase/database.types";

export type GroupCareRow = Tables<"group_care">;

// Minimal lamb_info projection used to render a group's member roster
// (see useGroupCareMembers in data/queries.ts). first_name/last_name
// overridden to non-null — DB allows NULL, app has always assumed
// non-null here (see grill-me 2026-08-12, `supabase_generated_types`
// project memory). is_leader_group_care marks whether this member is a
// leader of their assigned group_care (see grill-me 2026-08-12,
// `group_care_leader` project memory — reused instead of adding a new
// field on group_care itself).
export type GroupCareMember = Pick<
  Tables<"lamb_info">,
  | "id"
  | "nick_name"
  | "profile_picture"
  | "group_care"
  | "is_leader_group_care"
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
