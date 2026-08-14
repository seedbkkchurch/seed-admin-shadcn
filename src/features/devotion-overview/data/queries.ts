import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import {
  type DevotionOverviewEntry,
  type DevotionOverviewMember,
} from "./schema";

const devotionOverviewKeys = {
  members: ["devotion-overview", "members"] as const,
  entries: (lambIds: string[]) =>
    ["devotion-overview", "entries", lambIds] as const,
};

// สมาชิก active (status=true) ทั้งโบส เรียงชื่อ A-Z เป็น default — ขอบเขต
// เดียวกับที่ตกลงใน grill-me 2026-08-14 (`devotion_overview_design`),
// join group_care + ใช้คอลัมน์ gender ที่มีอยู่แล้วสำหรับ subtitle ใต้ชื่อ
export function useDevotionOverviewMembers() {
  return useQuery({
    queryKey: devotionOverviewKeys.members,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_info")
        .select(
          "id, nick_name, first_name, last_name, profile_picture, gender, group_care_info:group_care(id, name)",
        )
        .eq("status", true)
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data as DevotionOverviewMember[];
    },
  });
}

// เฝ้าเดี่ยวย้อนหลัง 366 วันของสมาชิก active — ดึงครั้งเดียวใช้ได้ทั้งตาราง
// รายเดือน (เดือนนี้) และตารางรายปี (12 เดือนล่าสุด) ไม่ query แยกตาม tab.
// เลือกแค่ lamb_id + devotion_date พอ (ไม่ต้อง join lamb_info ซ้ำ — ใช้คู่กับ
// useDevotionOverviewMembers) ปริมาณเล็กมากตามที่ประเมินไว้ใน
// docs/devotion-db-design.md จึง aggregate ฝั่ง client ได้สบายๆ ไม่ต้องมี RPC
export function useDevotionOverviewEntries(activeLambIds: string[]) {
  return useQuery({
    queryKey: devotionOverviewKeys.entries(activeLambIds),
    enabled: activeLambIds.length > 0,
    queryFn: async () => {
      const cutoff = format(subDays(new Date(), 366), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("lamb_devotion")
        .select("lamb_id, devotion_date")
        .in("lamb_id", activeLambIds)
        .gte("devotion_date", cutoff);

      if (error) throw error;
      return data as DevotionOverviewEntry[];
    },
  });
}
