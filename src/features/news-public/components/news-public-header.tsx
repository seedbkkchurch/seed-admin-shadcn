import { Link } from "@tanstack/react-router";
import { Logo } from "@/assets/logo";
import { ThemeSwitch } from "@/components/theme-switch";

// Header เรียบง่ายสำหรับหน้าข่าว public (ไม่ต้อง login) — เหมือน
// features/devotion-public/components/public-header.tsx ทุกประการ แค่แยก
// component ต่างหากเพราะข้อความ/ลิงก์ต่างกัน (ข่าว ไม่ใช่เฝ้าเดี่ยว)
export function NewsPublicHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-4">
        <Link to="/news" className="flex items-center gap-2 font-semibold">
          <Logo />
          <span>ข่าว</span>
        </Link>
        <div className="ms-auto">
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
