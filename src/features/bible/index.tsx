import { getRouteApi } from "@tanstack/react-router";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { BiblePanel } from "./components/bible-panel";
import { type BibleEnglishVersion, type BibleLanguageMode } from "./data/types";

const route = getRouteApi("/_authenticated/bible/$book/$chapter");

// หน้า Bible แยกออกมาต่างหาก — ต้อง login (ดู grill-me 2026-08-13 ตอนแรกเลือก
// public ไม่ต้อง login แต่ผู้ใช้เปลี่ยนใจภายหลังให้ย้ายเข้า _authenticated +
// เพิ่มเมนู sidebar 2026-08-13) ใช้ Header/Main pattern เดียวกับหน้า
// attendance เพื่อให้ได้ sidebar ของแอปมาด้วยฟรีๆ จาก AuthenticatedLayout
// book/chapter/lang/enVersion sync ลง path param + URL search (?lang=&enVersion=)
// ส่วนแสดงผลจริง (nav + verse list + โหมดอ่านมือถือ) ย้ายไปอยู่ใน
// components/bible-panel.tsx แล้ว — แยกออกมาเพื่อใช้ร่วมกับ
// BibleQuickReferenceSheet ในหน้าเขียนเฝ้าเดี่ยวด้วย (ดู grill-me 2026-08-13
// "เอา bible ไปใช้กับตอนเขียนเฝ้าเดี่ยว") หน้านี้ยังคง sync state ลง URL
// path/search เหมือนเดิมทุกประการ enVersion เพิ่มมาทีหลัง (2026-08-21 "เพิ่ม
// NIV") ไม่มีอะไรเปลี่ยนพฤติกรรมเดิม
export function BiblePage() {
  const { book, chapter } = route.useParams();
  const search = route.useSearch();
  const navigate = route.useNavigate();

  const bookNumber = Number(book);
  const chapterNumber = Number(chapter);
  const mode: BibleLanguageMode = search.lang ?? "both";
  // โหมดปิด hover/tap คำ Strong's ฮีบรู/กรีก ทั้งหมด — เริ่มต้นเปิด (ดู
  // grill-me 2026-08-13)
  const showStrongs = search.strongs ?? true;
  const enVersion: BibleEnglishVersion = search.enVersion ?? "kjv";

  // chapter override ใช้ตอนโหมดอ่านสไวป์ข้ามหนังสือถอยหลัง (ไปบทสุดท้ายของ
  // เล่มก่อนหน้า แทนที่จะ reset เป็นบท 1 เหมือนตอนเปลี่ยนหนังสือจาก nav ปกติ)
  const handleBookChange = (nextBook: number, nextChapter = 1) => {
    navigate({
      to: "/bible/$book/$chapter",
      params: { book: String(nextBook), chapter: String(nextChapter) },
      search: (prev) => prev,
    });
  };

  const handleChapterChange = (nextChapter: number) => {
    navigate({
      to: "/bible/$book/$chapter",
      params: { book, chapter: String(nextChapter) },
      search: (prev) => prev,
    });
  };

  const handleModeChange = (nextMode: BibleLanguageMode) => {
    navigate({
      search: (prev) => ({ ...prev, lang: nextMode }),
    });
  };

  const handleShowStrongsChange = (nextShow: boolean) => {
    navigate({
      search: (prev) => ({ ...prev, strongs: nextShow }),
    });
  };

  const handleEnVersionChange = (nextVersion: BibleEnglishVersion) => {
    navigate({
      search: (prev) => ({ ...prev, enVersion: nextVersion }),
    });
  };

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            พระคัมภีร์ King James Version
          </h2>
          <p className="text-muted-foreground">
            มีรหัส Strong&apos;s กำกับ — แตะ/hover คำที่ขีดเส้นใต้จางๆ
            เพื่อดูความหมายจาก dictionary ภาษากรีก/ฮีบรู
          </p>
        </div>

        <BiblePanel
          variant="page"
          bookNumber={bookNumber}
          chapter={chapterNumber}
          mode={mode}
          showStrongs={showStrongs}
          enVersion={enVersion}
          onBookChange={handleBookChange}
          onChapterChange={handleChapterChange}
          onModeChange={handleModeChange}
          onShowStrongsChange={handleShowStrongsChange}
          onEnVersionChange={handleEnVersionChange}
        />
      </Main>
    </>
  );
}
