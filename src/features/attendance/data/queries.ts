import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { type AttendanceMember, type AttendanceRow } from "./schema";

const attendanceKeys = {
  // สมาชิกของกลุ่มไม่ขึ้นกับสัปดาห์ — แคชแยกจาก attendance ของแต่ละสัปดาห์
  members: (groupId: string | undefined) =>
    ["attendance", "members", groupId] as const,
  week: (groupId: string | undefined, weekStart: string) =>
    ["attendance", "week", groupId, weekStart] as const,
};

// สมาชิกทั้งหมดของกลุ่มแคร์ที่เลือก (ไม่ผูกกับสัปดาห์ใดสัปดาห์หนึ่ง)
export function useAttendanceMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: attendanceKeys.members(groupId),
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select(
          "id, nick_name, first_name, last_name, profile_picture, group_care",
        )
        .eq("group_care", groupId as string)
        .order("nick_name", { ascending: true });

      if (error) throw error;
      return data as AttendanceMember[];
    },
  });
}

// แถว lamb_attendance_log ที่มีอยู่แล้วสำหรับกลุ่ม+สัปดาห์ที่เลือก — แถวไหนยังไม่มี
// ในผลลัพธ์นี้ แปลว่า "ยังไม่ได้เช็ค" (ดู docs/attendance-db-design.md ข้อ
// "ไม่ pre-populate")
export function useAttendanceWeek(
  groupId: string | undefined,
  weekStart: string,
) {
  return useQuery({
    queryKey: attendanceKeys.week(groupId, weekStart),
    enabled: !!groupId,
    queryFn: async () => {
      const { data: members, error: membersError } = await supabase
        .from("lamb_info")
        .select("id")
        .eq("group_care", groupId as string);

      if (membersError) throw membersError;

      const lambIds = (members ?? []).map((member) => member.id);
      if (lambIds.length === 0) return [] as AttendanceRow[];

      const { data, error } = await supabase
        .from("lamb_attendance_log")
        .select(
          "id, lamb_id, week_start, came_to_church, came_to_group_care, note",
        )
        .in("lamb_id", lambIds)
        .eq("week_start", weekStart);

      if (error) throw error;
      return data as AttendanceRow[];
    },
  });
}

type UpsertAttendanceInput = {
  lambId: string;
  weekStart: string;
  cameToChurch: boolean;
  cameToGroupCare: boolean;
  note: string | null;
};

// Upsert เดียวใช้ทั้งตอนติ๊ก checkbox และตอนแก้ note — ยิงค่าทั้งแถวทุกครั้งเพราะ
// unique constraint คือ (lamb_id, week_start) ไม่ใช่รายคอลัมน์
export function useUpsertAttendance(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertAttendanceInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("lamb_attendance_log")
        .upsert(
          {
            lamb_id: input.lambId,
            week_start: input.weekStart,
            came_to_church: input.cameToChurch,
            came_to_group_care: input.cameToGroupCare,
            note: input.note,
            recorded_by: user?.id ?? null,
          },
          { onConflict: "lamb_id,week_start" },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.week(groupId, variables.weekStart),
      });
    },
  });
}
