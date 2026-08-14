import { Link, useRouterState } from "@tanstack/react-router";
import {
  BellPlus,
  ClipboardCheck,
  NotebookPen,
  Rss,
  UserRound,
} from "lucide-react";
import { useMyLamb } from "@/hooks/use-my-lamb";
import { cn } from "@/lib/utils";

// Bottom tab bar สำหรับจอมือถือ (< 768px, breakpoint เดียวกับ useIsMobile /
// sidebar) — โชว์ทุกหน้าหลัง login (อยู่ใน AuthenticatedLayout) คู่กับปุ่ม
// hamburger เดิมที่เปิด sidebar drawer เต็มรูป (ยังเก็บไว้ทั้งอัน ไม่ใช่ตัว
// แทนกัน) ตกลงใน grill-me 2026-08-14 รอบหก (`mobile_tab_bar_design` ใน
// project memory): 5 เมนูหลักที่สมาชิกทั่วไปใช้บ่อยสุด ไม่ใช่เมนู admin
// ทั้งหมด (ต่างจาก sidebar ที่มีทุกอัน)
//
// "โปรไฟล์ของตัวเอง" — เดิม hardcode ไปที่ lamb_info คนเดียว (Hatthakit
// Soyrak, id 9ec9835c-4c7f-4a7c-b904-7389906169ad) เป็น mock ชั่วคราวตอนยัง
// ไม่มีการผูก auth user เข้ากับ lamb_id — ตอนนี้ auth เชื่อมแล้ว (ตกลงใน
// grill-me 2026-08-14 รอบเจ็ด, `rbac_design`/`auth_lamb_link_design`)
// เปลี่ยนมาใช้ useMyLamb() (lamb_info.auth_user_id = auth.uid()) แทน
// hardcode — ถ้ายังไม่ resolve/ไม่มีลูกแกะผูกอยู่ (เช่น staff account) แท็บนี้
// จะกดไม่ได้แทนที่จะพาไปหน้าคนอื่นแบบผิดๆ

const attendancePath = "/attendance" as const;
const devotionNewPath = "/lamb-info/devotion/new" as const;
const devotionFeedPath = "/lamb-info/devotion" as const;
const subscribePath = "/subscribe" as const;

// isActive: exact match ยกเว้นระบุ prefixMatch เพื่อกันชนกับ path ย่อยของ
// ตัวเอง (เช่น feed vs feed/new ที่ path prefix เดียวกัน — ไม่ใช้ prefix
// สำหรับ feed)
function useIsPathActive(path: string) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return pathname === path;
}

export function MobileTabBar() {
  const { data: myLamb } = useMyLamb();
  const isAttendanceActive = useIsPathActive(attendancePath);
  const isDevotionNewActive = useIsPathActive(devotionNewPath);
  const isDevotionFeedActive = useIsPathActive(devotionFeedPath);
  const isProfileActive = useIsPathActive(
    myLamb ? `/lamb-info/${myLamb.id}` : "",
  );
  const isSubscribeActive = useIsPathActive(subscribePath);

  const itemClass = (active: boolean) =>
    cn(
      "flex flex-col items-center justify-center gap-1 py-2 text-[11px]",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
    );
  const disabledItemClass =
    "flex flex-col items-center justify-center gap-1 py-2 text-[11px] text-muted-foreground/40";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="เมนูหลัก"
    >
      <ul className="grid grid-cols-5">
        <li>
          <Link to={attendancePath} className={itemClass(isAttendanceActive)}>
            <ClipboardCheck className="size-5" />
            <span className="leading-none">เช็คชื่อ</span>
          </Link>
        </li>
        <li>
          <Link to={devotionNewPath} className={itemClass(isDevotionNewActive)}>
            <NotebookPen className="size-5" />
            <span className="leading-none">เขียนเฝ้าเดี่ยว</span>
          </Link>
        </li>
        <li>
          <Link to={devotionFeedPath} className={itemClass(isDevotionFeedActive)}>
            <Rss className="size-5" />
            <span className="leading-none">Feed</span>
          </Link>
        </li>
        <li>
          {myLamb ? (
            <Link
              to="/lamb-info/$lambId"
              params={{ lambId: myLamb.id }}
              className={itemClass(isProfileActive)}
            >
              <UserRound className="size-5" />
              <span className="leading-none">โปรไฟล์</span>
            </Link>
          ) : (
            <span className={disabledItemClass} aria-disabled="true">
              <UserRound className="size-5" />
              <span className="leading-none">โปรไฟล์</span>
            </span>
          )}
        </li>
        <li>
          <Link to={subscribePath} className={itemClass(isSubscribeActive)}>
            <BellPlus className="size-5" />
            <span className="leading-none">แจ้งเตือน</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
