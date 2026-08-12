import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { type GroupCareMember, type GroupCareRow } from "./schema";

const groupCareKeys = {
  list: ["group-care", "admin-list"] as const,
  // Separate cache entry from lamb-info's own queries (see
  // features/lamb-info/data/queries.ts) — this fetch is scoped to just the
  // fields the members dialog needs, not the full lamb_info row.
  members: ["group-care", "members"] as const,
};

export function useGroupCareList() {
  return useQuery({
    queryKey: groupCareKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_care")
        .select("id, name, address, day")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as GroupCareRow[];
    },
  });
}

// Every lamb assigned to a care group, regardless of active/inactive
// status — used to compute each group's member count and roster. Fetched
// once and grouped client-side per group_care.id (see index.tsx) rather
// than queried per-row, since the lamb_info table is small.
export function useGroupCareMembers() {
  return useQuery({
    queryKey: groupCareKeys.members,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select(
          "id, nick_name, first_name, last_name, profile_picture, group_care, is_leader_group_care",
        )
        .order("nick_name", { ascending: true });

      if (error) throw error;
      return data as GroupCareMember[];
    },
  });
}

type GroupCareInput = Omit<GroupCareRow, "id">;

export function useCreateGroupCare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: GroupCareInput) => {
      const { data, error } = await supabase
        .from("group_care")
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupCareKeys.list });
    },
  });
}

export function useUpdateGroupCare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: GroupCareInput;
    }) => {
      const { data, error } = await supabase
        .from("group_care")
        .update(values)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupCareKeys.list });
    },
  });
}

export function useDeleteGroupCare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("group_care").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupCareKeys.list });
    },
  });
}
