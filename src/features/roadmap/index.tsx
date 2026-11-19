import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { BibleMusicButton } from "@/features/bible-music/components/bible-music-button";
import { MyDevotionFan } from "./components/my-devotion-fan";

// หน้า /roadmap — การ์ดพัด "เฝ้าเดี่ยวของฉัน" เต็มหน้า ตัวการ์ดพัด + ข้อมูล
// ย้ายไปอยู่ที่ components/my-devotion-fan.tsx (2026-11-15) เพื่อให้หน้า
// จิตวิญญาณของฉัน (/spiritual) เอาไปวางเป็นส่วนหนึ่งได้ด้วย หน้านี้ยังอยู่
// เหมือนเดิม
export function Roadmap() {
  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <BibleMusicButton className="rounded-full" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col">
        <MyDevotionFan />
      </Main>
    </>
  );
}
