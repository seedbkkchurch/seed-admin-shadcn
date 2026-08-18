import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type {
  PrayerRequest,
  PrayerRequestCreateInput,
  PrayerRequestUpdateInput,
} from "./schema";

const prayerRequestKeys = {
  // เจ้าของเท่านั้นที่กรอก/เห็นรายการของตัวเองในหน้านี้ (self-service ตกลงใน
  // grill-me) — key ผูกกับ lambId เสมอ ไม่มี query "ทั้งหมด" แบบ admin table
  mine: (lambId: string) => ["lamb-prayer-request", "mine", lambId] as const,
};

export function useMyPrayerRequests(lambId: string | undefined) {
  return useQuery({
    queryKey: prayerRequestKeys.mine(lambId ?? ""),
    enabled: !!lambId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_prayer_request")
        .select("*")
        .eq("lamb_id", lambId as string)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PrayerRequest[];
    },
  });
}

export function useCreatePrayerRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: PrayerRequestCreateInput) => {
      const { data, error } = await supabase
        .from("lamb_prayer_request")
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      return data as PrayerRequest;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: prayerRequestKeys.mine(variables.lamb_id),
      });
    },
  });
}

export function useUpdatePrayerRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      lambId: string;
      values: PrayerRequestUpdateInput;
    }) => {
      const { data, error } = await supabase
        .from("lamb_prayer_request")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as PrayerRequest;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: prayerRequestKeys.mine(variables.lambId),
      });
    },
  });
}

// แยกออกจาก useUpdatePrayerRequest เพราะ is_answered/answered_date ต้อง
// อัปเดตคู่กันเสมอ — uncheck (answeredDate: null) ต้อง revert ทั้งสอง field
// กลับเป็น "ยังไม่ตอบ" ได้ตามที่ตกลงใน grill-me (ไม่ใช่ audit-trail กันแก้)
export function useSetPrayerRequestAnswered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      answeredDate,
    }: {
      id: string;
      lambId: string;
      // null = uncheck/revert กลับเป็น "ยังไม่ตอบ", string (yyyy-MM-dd) =
      // ติ๊กว่าตอบแล้วในวันที่นี้ (เลือกย้อนหลังได้ ไม่บังคับวันนี้เสมอไป)
      answeredDate: string | null;
    }) => {
      const { data, error } = await supabase
        .from("lamb_prayer_request")
        .update({
          is_answered: answeredDate !== null,
          answered_date: answeredDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as PrayerRequest;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: prayerRequestKeys.mine(variables.lambId),
      });
    },
  });
}

export function useDeletePrayerRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; lambId: string }) => {
      const { error } = await supabase
        .from("lamb_prayer_request")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: prayerRequestKeys.mine(variables.lambId),
      });
    },
  });
}
