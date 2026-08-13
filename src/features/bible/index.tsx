import { getRouteApi } from "@tanstack/react-router";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { BiblePanel } from "./components/bible-panel";
import { type BibleLanguageMode } from "./data/types";

const route = getRouteApi("/_authenticated/bible/$book/$chapter");

// หน้า Bible แยกออกมาต่างหาก — ต้อง login (ดู grill-me 2026-08-13 ตอนแรกเลือก
// public ไม่ต้อง login แต่ผู้ใช้เปลี่ยนใจภายหลังให้ย้ายเข้า _authenticated +
// เพิ่มเมนู sidebar 2026-08-13) ใช้ Header/Main pattern เดียวกับหน้า
// attendance เพื่อให้ได้ sidebar ของแอปมาด้วยฟรีๆ จาก AuthenticatedLayout
// book/chapter/lang sync ลง path param + URL search (?lang=)
// ส่วนแสดงผลจริง (nav + verse list) ย้ายไปอยู่ใน components/bible-panel.tsx
// แล้ว — แยกออกมาเพื่อใช้ร่วมกับ BibleQuickReferenceSheet ในหน้าเขียน
// เฝ้าเดี่ยวด้วย (ดู grill-me 2026-08-13 "เอา bible ไปใช้กับตอนเขียน
// เฝ้าเดี่ยว") หน้านี้ยังคง sync state ลง URL path/search เหมือนเดิมทุก
// ประการ ไม่มีอะไรเปลี่ยนพฤติกรรม
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

  const handleBookChange = (nextBook: number) => {
    navigate({
      to: "/bible/$book/$chapter",
      params: { book: String(nextBook), chapter: "1" },
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
          onBookChange={handleBookChange}
          onChapterChange={handleChapterChange}
          onModeChange={handleModeChange}
          onShowStrongsChange={handleShowStrongsChange}
        />
      </Main>
    </>
  );
}
