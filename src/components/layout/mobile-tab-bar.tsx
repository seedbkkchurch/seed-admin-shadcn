import { Link, useRouterState } from "@tanstack/react-router";
import {
  BellPlus,
  ClipboardCheck,
  NotebookPen,
  Rss,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Bottom tab bar สำหรับจอมือถือ (< 768px, breakpoint เดียวกับ useIsMobile /
// sidebar) — โชว์ทุกหน้าหลัง login (อยู่ใน AuthenticatedLayout) คู่กับปุ่ม
// hamburger เดิมที่เปิด sidebar drawer เต็มรูป (ยังเก็บไว้ทั้งอัน ไม่ใช่ตัว
// แทนกัน) ตกลงใน grill-me 2026-08-14 รอบหก (`mobile_tab_bar_design` ใน
// project memory): 5 เมนูหลักที่สมาชิกทั่วไปใช้บ่อยสุด ไม่ใช่เมนู admin
// ทั้งหมด (ต่างจาก sidebar ที่มีทุกอัน)
//
// "โปรไฟล์ของตัวเอง" hardcode ไปที่ lamb_info คนเดียว (Hatthakit Soyrak) เป็น
// mock ชั่วคราว — ยังไม่มีการผูก auth user เข้ากับ lamb_id จริง (ดู
// [[rbac_design]]) revisit ตอน auth เชื่อมแล้วให้เปลี่ยนเป็น lambId ของผู้ใช้
// ที่ login อยู่จริง
const MOCK_MY_LAMB_ID = "9ec9835c-4c7f-4a7c-b904-7389906169ad";

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
  const isAttendanceActive = useIsPathActive(attendancePath);
  const isDevotionNewActive = useIsPathActive(devotionNewPath);
  const isDevotionFeedActive = useIsPathActive(devotionFeedPath);
  const isProfileActive = useIsPathActive(`/lamb-info/${MOCK_MY_LAMB_ID}`);
  const isSubscribeActive = useIsPathActive(subscribePath);

  const itemClass = (active: boolean) =>
    cn(
      "flex flex-col items-center justify-center gap-1 py-2 text-[11px]",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
    );

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
          <Link
            to="/lamb-info/$lambId"
            params={{ lambId: MOCK_MY_LAMB_ID }}
            className={itemClass(isProfileActive)}
          >
            <UserRound className="size-5" />
            <span className="leading-none">โปรไฟล์</span>
          </Link>
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
