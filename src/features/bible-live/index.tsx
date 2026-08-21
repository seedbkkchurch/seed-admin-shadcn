import { getRouteApi } from "@tanstack/react-router";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useBibleBooks } from "@/features/bible/data/queries";
import { BookCombobox } from "@/features/bible/components/book-combobox";
import { ChapterInput } from "@/features/bible/components/chapter-input";
import { BibleSelect } from "./components/bible-select";
import { PassageView } from "./components/passage-view";
import { useLiveBiblePassage, useYouVersionBibles } from "./data/queries";
import { usfmRef } from "./data/usfm-codes";

const route = getRouteApi("/_authenticated/bible-live/$book/$chapter/");

// หน้าอ่านพระคัมภีร์แบบสด ผ่าน YouVersion Platform API (Edge Function
// youversion-proxy) — แยกจากหน้า /bible (KJV + ไทย KJV, ไฟล์ static) เดิม
// โดยสิ้นเชิงตามที่ตกลงกันไว้ (ดู grill-me 2026-08-20) ไม่ cache/persist
// เนื้อความไว้ที่ไหนนอกจาก react-query in-memory cache ของแท็บนี้ (หายเมื่อ
// ปิด/รีเฟรช) — ทุกครั้งที่เปลี่ยนบท/เปลี่ยนฉบับคือเรียก API สดใหม่
export function BibleLive() {
  const { book, chapter } = route.useParams();
  const search = route.useSearch();
  const navigate = route.useNavigate();

  const bookNumber = Number(book);
  const chapterNumber = Number(chapter);
  const bibleId = search.bibleId;

  const booksQuery = useBibleBooks();
  const biblesQuery = useYouVersionBibles("tha");
  const ref = usfmRef(bookNumber, chapterNumber);
  const passageQuery = useLiveBiblePassage(bibleId, ref);

  const activeBook = booksQuery.data?.find((b) => b.number === bookNumber);

  const handleBookChange = (nextBook: number) => {
    navigate({
      to: "/bible-live/$book/$chapter",
      params: { book: String(nextBook), chapter: "1" },
      search: (prev) => prev,
    });
  };

  const handleChapterChange = (nextChapter: number) => {
    navigate({
      to: "/bible-live/$book/$chapter",
      params: { book, chapter: String(nextChapter) },
      search: (prev) => prev,
    });
  };

  const handleBibleChange = (nextBibleId: string) => {
    navigate({ search: (prev) => ({ ...prev, bibleId: nextBibleId }) });
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
            พระคัมภีร์ (Live)
          </h2>
          <p className="text-muted-foreground">
            อ่านสดผ่าน YouVersion Platform API — ไม่ได้เก็บเนื้อความไว้ในระบบ
            ทุกครั้งที่เปลี่ยนบทคือเรียก API ใหม่
          </p>
        </div>

        {biblesQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>โหลดรายชื่อฉบับไม่สำเร็จ</AlertTitle>
            <AlertDescription>
              {biblesQuery.error instanceof Error
                ? biblesQuery.error.message
                : "Something went wrong."}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <BibleSelect
            bibles={biblesQuery.data?.data ?? []}
            bibleId={bibleId}
            onChange={handleBibleChange}
          />
          {booksQuery.data ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">หนังสือ</p>
              <BookCombobox
                books={booksQuery.data}
                bookNumber={bookNumber}
                onChange={handleBookChange}
              />
            </div>
          ) : null}
          {activeBook ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">บท</p>
              <ChapterInput
                chapter={chapterNumber}
                chapterCount={activeBook.chapterCount}
                onChange={handleChapterChange}
              />
            </div>
          ) : null}
        </div>

        {!bibleId ? (
          <Alert>
            <AlertTitle>เลือกฉบับก่อน</AlertTitle>
            <AlertDescription>
              เลือกฉบับจาก dropdown ด้านบนก่อน ถึงจะเริ่มดึงเนื้อความได้
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <PassageView
                isPending={passageQuery.isPending}
                isError={passageQuery.isError}
                error={passageQuery.error}
                data={passageQuery.data}
              />
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  );
}
