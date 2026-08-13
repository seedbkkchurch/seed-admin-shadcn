import { getRouteApi } from "@tanstack/react-router";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useBibleBookFile, useBibleBooks } from "./data/queries";
import { BibleNav } from "./components/bible-nav";
import { VerseBlock, versesToMap } from "./components/verse-block";
import { type BibleLanguageMode } from "./data/types";

const route = getRouteApi("/_authenticated/bible/$book/$chapter");

// หน้า Bible แยกออกมาต่างหาก — ต้อง login (ดู grill-me 2026-08-13 ตอนแรกเลือก
// public ไม่ต้อง login แต่ผู้ใช้เปลี่ยนใจภายหลังให้ย้ายเข้า _authenticated +
// เพิ่มเมนู sidebar 2026-08-13) ใช้ Header/Main pattern เดียวกับหน้า
// attendance เพื่อให้ได้ sidebar ของแอปมาด้วยฟรีๆ จาก AuthenticatedLayout
// book/chapter/lang sync ลง path param + URL search (?lang=)
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

  const { data: books, isPending: booksPending, isError: booksError } =
    useBibleBooks();

  const activeBook = books?.find((b) => b.number === bookNumber);

  const kjvFile = useBibleBookFile("kjv", bookNumber);
  const thaiFile = useBibleBookFile("thai", bookNumber);

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

  const enVerses = versesToMap(kjvFile.data?.chapters[String(chapterNumber)]);
  const thVerses = versesToMap(
    thaiFile.data?.chapters[String(chapterNumber)],
  );
  const verseNumbers = Array.from(
    new Set([...enVerses.keys(), ...thVerses.keys()]),
  ).sort((a, b) => a - b);

  const isLoadingChapter =
    (mode !== "th" && kjvFile.isPending) ||
    (mode !== "en" && thaiFile.isPending);
  const isChapterError = kjvFile.isError || thaiFile.isError;

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

        {booksError ? (
          <Alert variant="destructive">
            <AlertTitle>โหลดรายชื่อหนังสือไม่สำเร็จ</AlertTitle>
            <AlertDescription>ลองรีเฟรชหน้านี้อีกครั้ง</AlertDescription>
          </Alert>
        ) : booksPending || !books ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <BibleNav
            books={books}
            bookNumber={bookNumber}
            chapter={chapterNumber}
            mode={mode}
            showStrongs={showStrongs}
            onBookChange={handleBookChange}
            onChapterChange={handleChapterChange}
            onModeChange={handleModeChange}
            onShowStrongsChange={handleShowStrongsChange}
          />
        )}

        {/* มือถือ: ไม่มีกรอบ/border รอบนอก ลด padding เหลือ p-3 ให้เนื้อที่ไป
        เยอะสุด — desktop ยังเป็น card เหมือนเดิม (ดู grill-me mobile-fit
        2026-08-13) */}
        <div className="p-3 sm:rounded-lg sm:border sm:p-6">
          <h3 className="mb-3 text-lg font-semibold">
            {activeBook
              ? `${activeBook.nameTh} บทที่ ${chapterNumber}`
              : `บทที่ ${chapterNumber}`}
          </h3>

          {isChapterError ? (
            <Alert variant="destructive">
              <AlertTitle>โหลดพระคัมภีร์ไม่สำเร็จ</AlertTitle>
              <AlertDescription>ลองรีเฟรชหน้านี้อีกครั้ง</AlertDescription>
            </Alert>
          ) : isLoadingChapter ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : verseNumbers.length === 0 ? (
            <p className="text-muted-foreground text-sm">ไม่พบข้อมูลบทนี้</p>
          ) : (
            <div>
              {verseNumbers.map((v) => (
                <VerseBlock
                  key={v}
                  verseNumber={v}
                  enText={enVerses.get(v)}
                  thText={thVerses.get(v)}
                  mode={mode}
                  showStrongs={showStrongs}
                />
              ))}
            </div>
          )}
        </div>
      </Main>
    </>
  );
}
