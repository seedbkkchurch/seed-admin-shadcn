import { useIsSuperAdmin } from "@/features/user-roles/data/queries";
import { sidebarData } from "./sidebar-data";
import { type NavGroup } from "../types";

// กรอง navGroup ที่ superAdminOnly ออกให้คนที่ไม่ใช่ super_admin — ใช้ร่วมกัน
// ทั้ง AppSidebar และ CommandMenu (Cmd+K) เพราะทั้งสองที่ดึงจาก sidebarData
// เดียวกัน กรองที่จุดเดียวกันจุดนี้แล้วทั้งสองที่จะซ่อน/โชว์ตรงกันเสมอ ไม่ต้อง
// แก้แยกสองที่ (grill-me 2026-08-18)
//
// ระหว่างที่ isPending (ยังไม่รู้ผล) ถือว่า "ยังไม่ใช่ super_admin" ไปก่อน —
// เลือกซ่อนไว้ก่อนเป็นค่าเริ่มต้นแทนที่จะโชว์แล้วค่อยหาย ปลอดภัยกว่าและไม่มี
// เมนู sensitive กระพริบให้เห็นแวบหนึ่ง
export function useVisibleNavGroups(): NavGroup[] {
  const { data: isSuperAdmin } = useIsSuperAdmin();

  return sidebarData.navGroups.filter(
    (group) => !group.superAdminOnly || isSuperAdmin === true,
  );
}
