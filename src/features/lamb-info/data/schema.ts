import type { Tables } from "@/lib/supabase/database.types";

// Row shape from the generated Supabase schema, with two intentional
// overrides: the DB allows `first_name`/`last_name` to be NULL, but every
// consumer in this app has always assumed non-null strings (forms require
// them, display code never null-checks them). Left as an override rather
// than threading null-checks through every component — see grill-me
// (2026-08-12), tracked in the `supabase_generated_types` project memory.
export type LambInfo = Omit<Tables<"lamb_info">, "first_name" | "last_name"> & {
  first_name: string;
  last_name: string;
};

export type GroupCare = Pick<Tables<"group_care">, "id" | "name">;

export type PersonalityType = Tables<"personality_type">;

// Lightweight lamb reference used for mentor/mentee display — just enough
// to render a name + avatar + link. See mentorship_add_mentor_id migration
// (grill-me 2026-08-28) and features/mentorship/.
export type MentorRef = Pick<
  LambInfo,
  "id" | "nick_name" | "first_name" | "last_name" | "profile_picture" | "role"
>;

// Row shape returned by the list query (lamb_info joined with its
// related lookup tables via Supabase's embedded resource syntax).
// The embedded group lookup is aliased to `group_care_info` because the
// raw FK column on lamb_info is itself named `group_care`.
export type LambInfoRow = LambInfo & {
  group_care_info: GroupCare | null;
  personality_type: PersonalityType | null;
  // Embedded via the lamb_info_mentor_id_fkey self-reference — null when
  // this lamb has no mentor assigned yet. Only present on
  // useLambInfoDetail (profile page); useLambInfoList doesn't select it.
  mentor?: MentorRef | null;
};
