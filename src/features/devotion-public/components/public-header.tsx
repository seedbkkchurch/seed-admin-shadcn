import { Link } from "@tanstack/react-router";
import { Logo } from "@/assets/logo";
import { ThemeSwitch } from "@/components/theme-switch";

// Header เรียบง่ายสำหรับหน้า public (ไม่ต้อง login) — ตัด SidebarTrigger /
// Search / ConfigDrawer / ProfileDropdown ออกทั้งหมดเพราะพึ่งพา
// SidebarProvider/session ที่หน้าเหล่านี้ไม่มี (อยู่นอก AuthenticatedLayout,
// ดู grill-me 2026-08-16) เหลือแค่โลโก้ + สลับธีม
export function PublicHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-4">
        <Link to="/devotion" className="flex items-center gap-2 font-semibold">
          <Logo />
          <span>เฝ้าเดี่ยว</span>
        </Link>
        <div className="ms-auto">
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
