import { z } from "zod";

export const groupCareSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  day: z.string().nullable(),
});
export type GroupCareRow = z.infer<typeof groupCareSchema>;

// Minimal lamb_info projection used to render a group's member roster
// (see useGroupCareMembers in data/queries.ts).
export type GroupCareMember = {
  id: string;
  nick_name: string | null;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
  group_care: string | null;
};

// GroupCareRow augmented, client-side, with the members assigned to it —
// built in index.tsx by grouping useGroupCareMembers() output per
// group_care.id and handed down to the table/columns/dialogs.
export type GroupCareRowWithMembers = GroupCareRow & {
  members: GroupCareMember[];
};
