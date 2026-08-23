import { useIsSuperAdmin } from "@/features/user-roles/data/queries";
import { useMyRoles } from "@/hooks/use-my-roles";
import { sidebarData } from "./sidebar-data";
import { type NavGroup, type NavItem } from "../types";

// กรอง navGroup ที่ superAdminOnly ออกให้คนที่ไม่ใช่ super_admin — ใช้ร่วมกัน
// ทั้ง AppSidebar และ CommandMenu (Cmd+K) เพราะทั้งสองที่ดึงจาก sidebarData
// เดียวกัน กรองที่จุดเดียวกันจุดนี้แล้วทั้งสองที่จะซ่อน/โชว์ตรงกันเสมอ ไม่ต้อง
// แก้แยกสองที่ (grill-me 2026-08-18)
//
// ระหว่างที่ isPending (ยังไม่รู้ผล) ถือว่า "ยังไม่ใช่ super_admin" ไปก่อน —
// เลือกซ่อนไว้ก่อนเป็นค่าเริ่มต้นแทนที่จะโชว์แล้วค่อยหาย ปลอดภัยกว่าและไม่มี
// เมนู sensitive กระพริบให้เห็นแวบหนึ่ง
//
// เพิ่มการกรองรายการเมนูเดี่ยวๆ ด้วย hiddenForRoles (ต่างจาก superAdminOnly
// ที่ซ่อนทั้งกลุ่ม) — ใช้กับ "เช็คชื่อรายสัปดาห์"/"Lamb Info" ที่อยู่ในกลุ่ม
// General เดียวกับเมนูอื่นที่ member/visitor ยังต้องเห็นปกติ (Dashboard,
// เฝ้าเดี่ยว, ฯลฯ) เลยซ่อนทั้งกลุ่มไม่ได้ ต้องกรองรายรายการแทน — ค่า role
// เดียวกับที่ route beforeLoad ใช้ กัน route ไว้อีกชั้น (ดู
// checkIsLambAccessRestricted, grill-me 2026-08-23) — ระหว่างที่ roles ยัง
// โหลดไม่เสร็จ (roles.length === 0 ตอน isLoading) ถือว่า "ยังไม่รู้ผล" ซ่อน
// item ที่มี hiddenForRoles ไว้ก่อนเหมือนกัน ปลอดภัยกว่าโชว์แล้วค่อยหาย
function isItemVisible(
  item: NavItem,
  myRole: string | null,
  isRoleLoading: boolean,
): boolean {
  if (!item.hiddenForRoles || item.hiddenForRoles.length === 0) return true;
  if (isRoleLoading || myRole === null) return false;
  return !item.hiddenForRoles.includes(myRole);
}

export function useVisibleNavGroups(): NavGroup[] {
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const { roles, isLoading: isRoleLoading } = useMyRoles();
  const myRole = roles[0]?.code ?? null;

  return sidebarData.navGroups
    .filter((group) => !group.superAdminOnly || isSuperAdmin === true)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        isItemVisible(item, myRole, isRoleLoading),
      ),
    }));
}
