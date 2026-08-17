import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { GiftFromGodRow } from "@/features/lamb-info/data/gifts";
import type {
  DashboardAttendanceRow,
  DashboardGroupCare,
  DashboardLamb,
  DashboardPersonalityType,
} from "./schema";

const dashboardKeys = {
  lambs: ["dashboard", "lambs"] as const,
  gifts: ["dashboard", "gifts"] as const,
  groupCareList: ["dashboard", "group-care-list"] as const,
  personalityTypes: ["dashboard", "personality-types"] as const,
  attendance: (lambIds: string[], sinceWeekStart: string) =>
    ["dashboard", "attendance", lambIds, sinceWeekStart] as const,
};

// แกะทั้งหมดในระบบ (รวม inactive) — Dashboard เป็นภาพรวมทั้งโบส ไม่กรอง
// status เหมือน devotion-overview ที่ดึงเฉพาะ active (ตกลงใน grill-me
// 2026-08-14, `dashboard_design` ใน project memory)
export function useDashboardLambs() {
  return useQuery({
    queryKey: dashboardKeys.lambs,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select(
          "id, first_name, last_name, nick_name, profile_picture, gender, birthday, status, role, tags, interesting, group_care, personality_code, lamb_lesson_ch18_progress, lamb_lesson_life_progress",
        );

      if (error) throw error;
      return (data ?? []) as DashboardLamb[];
    },
  });
}

// รายชื่อกลุ่มแคร์ทั้งหมด (id+name) — ดึงทั้งแถวแทน head+count เพราะต้อง
// กรองแถว sentinel/placeholder "all"/"none" ออกก่อนนับจำนวนกลุ่มจริง (ยืนยัน
// จากข้อมูลจริงใน DB ว่ามีแค่ 2 แถวนี้ที่เป็น placeholder — วัน/ที่อยู่เป็น
// null ทั้งคู่ ต่างจากกลุ่มแคร์จริงทุกกลุ่ม) ดู
// computeGroupCareStats/SENTINEL_GROUP_NAMES ใน lib/aggregate.ts
export function useDashboardGroupCareList() {
  return useQuery({
    queryKey: dashboardKeys.groupCareList,
    queryFn: async () => {
      const { data, error } = await supabase.from("group_care").select("id, name");

      if (error) throw error;
      return (data ?? []) as DashboardGroupCare[];
    },
  });
}

// code -> archetype mapping สำหรับกราฟบุคลิกภาพ — ตารางเล็ก ดึงทั้งหมด
export function useDashboardPersonalityTypes() {
  return useQuery({
    queryKey: dashboardKeys.personalityTypes,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personality_type")
        .select("code, archetype");

      if (error) throw error;
      return (data ?? []) as DashboardPersonalityType[];
    },
  });
}

// ประวัติมาโบสถ์/แคร์ของสมาชิก active ย้อนหลังตั้งแต่ sinceWeekStart (สัปดาห์
// เก่าสุดในกราฟเทรนด์ 12 สัปดาห์) — เดียวกับ week_start convention ของหน้า
// attendance (อาทิตย์เป็นวันเริ่มสัปดาห์ ดู attendance/index.tsx toWeekStart)
export function useDashboardAttendance(
  lambIds: string[],
  sinceWeekStart: string,
) {
  return useQuery({
    queryKey: dashboardKeys.attendance(lambIds, sinceWeekStart),
    enabled: lambIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_attendance_log")
        .select("week_start, came_to_church, came_to_group_care")
        .in("lamb_id", lambIds)
        .gte("week_start", sinceWeekStart);

      if (error) throw error;
      return (data ?? []) as DashboardAttendanceRow[];
    },
  });
}

// คะแนนของประทานของทุกคนที่ทำแบบประเมินแล้ว — เฉพาะคนที่มี row ใน
// gift_from_god (คนที่ยังไม่ทำแบบประเมินจะไม่มี row เลย ไม่ใช่มี row ที่เป็น
// 0 ทุกช่อง) ตารางเล็ก ไม่ต้องแบ่งหน้า/กรองฝั่ง server
export function useDashboardGifts() {
  return useQuery({
    queryKey: dashboardKeys.gifts,
    queryFn: async () => {
      const { data, error } = await supabase.from("gift_from_god").select("*");

      if (error) throw error;
      return (data ?? []) as GiftFromGodRow[];
    },
  });
}
