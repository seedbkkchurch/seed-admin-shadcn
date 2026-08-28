import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { type MentorRef } from "@/features/lamb-info/data/schema";

// พี่เลี้ยงลูกแกะ (mentorship) — grill-me 2026-08-28. lamb_info.mentor_id
// เป็น self-reference บน lamb_info เอง (nullable, 1 ลูกแกะมีพี่เลี้ยงได้ 1
// คน) ดู migration mentorship_add_mentor_id — ตั้งตัวเองเป็นพี่เลี้ยงตัวเอง
// และความสัมพันธ์วนกลับ (A เป็นพี่เลี้ยง B แล้ว B ย้อนมาเป็นพี่เลี้ยง A) ถูก
// กันที่ DB trigger แล้ว (lamb_info_guard_mentor_change) — client ไม่ต้อง
// validate ซ้ำ แค่ดัก error message ตอน mutate ล้มเหลว

const mentorshipKeys = {
  list: ["mentorship", "list"] as const,
  mentorOptions: ["mentorship", "mentor-options"] as const,
  canEdit: ["mentorship", "can-edit"] as const,
  tree: ["mentorship", "tree"] as const,
};

export type MentorshipRow = MentorRef & {
  status: boolean | null;
  mentor_id: string | null;
  group_care_info: { name: string } | null;
};

// รายชื่อลูกแกะที่ status=true (active) เท่านั้น — backs ตาราง /mentorship
// (1 แถว/ลูกแกะ + dropdown เลือกพี่เลี้ยงในแถวนั้น) เรียงตามชื่อเหมือนหน้า
// Lamb Info หลัก — กรองคนที่ inactive ออกไปเลย (ไม่ใช่แค่ badge/sort ท้าย
// แบบหน้า Lamb Info หลัก) เพราะการจัดพี่เลี้ยง-ลูกแกะสนใจแค่คนที่ยังอยู่จริง
// ในคริสตจักรตอนนี้ (ดู grill-me 2026-08-28 "หน้า mentorship ให้แสดง
// ลูกแกะที่ยัง active อยู่หน่อย") — .order("status") เดิมตัดออกเพราะทุกแถว
// status=true เหมือนกันหมดแล้ว ไม่มีอะไรให้เรียงต่างจากนี้
export function useMentorshipList() {
  return useQuery({
    queryKey: mentorshipKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select(
          "id, nick_name, first_name, last_name, profile_picture, role, status, mentor_id, group_care_info:group_care!lamb_info_group_care_fkey(name)",
        )
        .eq("status", true)
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data as unknown as MentorshipRow[];
    },
  });
}

// ใครถูกเลือกเป็น "พี่เลี้ยง" ได้บ้าง — จำกัดเฉพาะ cell_leader/team_leader
// ขึ้นไป (ตกลงใน grill-me 2026-08-28) ทั้งคริสตจักร ไม่จำกัดตามกลุ่มแคร์
export function useMentorOptions() {
  return useQuery({
    queryKey: mentorshipKeys.mentorOptions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select("id, nick_name, first_name, last_name, profile_picture, role")
        .in("role", ["cell_leader", "team_leader", "admin", "super_admin"])
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data as MentorRef[];
    },
  });
}

// lamb:edit:mentor — team_leader/admin/super_admin (ไม่รวม cell_leader) ดู
// migration mentorship_role_permissions. Pattern เดียวกับ
// features/news/data/queries.ts checkCanWriteNews/useCanWriteNews
export async function checkCanEditMentor(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("auth_has_permission", {
    perm: "lamb:edit:mentor",
  });
  if (error) return false;
  return data === true;
}

export function useCanEditMentor() {
  return useQuery({
    queryKey: mentorshipKeys.canEdit,
    queryFn: checkCanEditMentor,
    staleTime: 5 * 60 * 1000,
  });
}

// ตั้ง/เปลี่ยน/ล้างพี่เลี้ยงของลูกแกะ 1 คน — ใช้ทั้งหน้าตาราง /mentorship
// และการ์ดพี่เลี้ยงบนหน้าโปรไฟล์ (mentor-card.tsx) mentorId เป็น null ได้
// (ล้างพี่เลี้ยง) DB trigger จะ throw ถ้าตั้งตัวเองหรือวนกลับ — โยน error
// message ของ Postgres ตรงๆ ให้ toast ฝั่ง caller แสดง
export function useUpdateMentor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lambId,
      mentorId,
    }: {
      lambId: string;
      mentorId: string | null;
    }) => {
      const { data, error } = await supabase
        .from("lamb_info")
        .update({ mentor_id: mentorId })
        .eq("id", lambId)
        .select("id, mentor_id")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.list });
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.tree });
      queryClient.invalidateQueries({
        queryKey: ["lamb-info", variables.lambId],
      });
      // ล้าง cache "mentees" ของทั้งพี่เลี้ยงเก่าและใหม่ก็ได้ แต่ไม่รู้ id
      // เก่าตรงนี้ — invalidate แบบกว้างด้วย predicate แทน (queryKey มี
      // "mentees" อยู่ในนั้น)
      queryClient.invalidateQueries({
        predicate: (q) => q.queryKey.includes("mentees"),
      });
    },
  });
}

// ข้อมูลทั้งหมดสำหรับผัง org-chart /mentorship-chart — ทุกคนที่ login แล้ว
// ดูได้ (read-only) ดึงมาแบนราบแล้วประกอบเป็นต้นไม้ฝั่ง client
// (chart.tsx buildMentorTree)
export function useMentorshipTree() {
  return useQuery({
    queryKey: mentorshipKeys.tree,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select(
          "id, nick_name, first_name, last_name, profile_picture, role, mentor_id, status",
        )
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data as (MentorRef & {
        mentor_id: string | null;
        status: boolean | null;
      })[];
    },
  });
}
