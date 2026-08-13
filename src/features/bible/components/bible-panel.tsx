import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useBibleBookFile, useBibleBooks } from "../data/queries";
import { type BibleLanguageMode } from "../data/types";
import { buildVerseQuoteHtml } from "../lib/build-verse-quote-html";
import { BibleNav } from "./bible-nav";
import { VerseBlock, versesToMap } from "./verse-block";

export type BiblePanelProps = {
  bookNumber: number;
  chapter: number;
  mode: BibleLanguageMode;
  showStrongs: boolean;
  onBookChange: (bookNumber: number) => void;
  onChapterChange: (chapter: number) => void;
  onModeChange: (mode: BibleLanguageMode) => void;
  onShowStrongsChange: (show: boolean) => void;
  // "page" = หน้า /bible เต็มจอ (หัวข้อใหญ่ + การ์ดมีขอบบน desktop) "embedded"
  // = ฝังใน BibleQuickReferenceSheet หน้าเขียนเฝ้าเดี่ยว (แคบกว่า ไม่มีขอบ,
  // มีโหมดเลือกข้อ) — ดู grill-me 2026-08-13
  variant?: "page" | "embedded";
  // โหมดเลือกข้อ + แทรกเข้า editor — ใช้เฉพาะ variant="embedded"
  selectable?: boolean;
  selectedVerses?: ReadonlySet<number>;
  onToggleVerse?: (verseNumber: number) => void;
  onInsertVerses?: (html: string) => void;
};

// ส่วนแสดงผลคัมภีร์ (เลือกหนังสือ/บท/ภาษา/Strong's + รายการข้อ) ที่ดึงมาจาก
// features/bible/index.tsx เดิม แยกออกมาเป็น component กลาง เพื่อใช้ได้ทั้ง
// หน้า /bible เต็มจอ (URL-synced) และฝังใน bottom sheet หน้าเขียนเฝ้าเดี่ยว
// (local state + localStorage) โดยไม่ต้องเขียน fetch/loading/error ซ้ำสองที่
// (ดู grill-me 2026-08-13 "เอา bible ไปใช้กับตอนเขียนเฝ้าเดี่ยว")
export function BiblePanel({
  bookNumber,
  chapter,
  mode,
  showStrongs,
  onBookChange,
  onChapterChange,
  onModeChange,
  onShowStrongsChange,
  variant = "page",
  selectable = false,
  selectedVerses,
  onToggleVerse,
  onInsertVerses,
}: BiblePanelProps) {
  const { data: books, isPending: booksPending, isError: booksError } =
    useBibleBooks();

  const activeBook = books?.find((b) => b.number === bookNumber);

  const kjvFile = useBibleBookFile("kjv", bookNumber);
  const thaiFile = useBibleBookFile("thai", bookNumber);

  const enVerses = versesToMap(kjvFile.data?.chapters[String(chapter)]);
  const thVerses = versesToMap(thaiFile.data?.chapters[String(chapter)]);
  const verseNumbers = Array.from(
    new Set([...enVerses.keys(), ...thVerses.keys()]),
  ).sort((a, b) => a - b);

  const isLoadingChapter =
    (mode !== "th" && kjvFile.isPending) ||
    (mode !== "en" && thaiFile.isPending);
  const isChapterError = kjvFile.isError || thaiFile.isError;

  const selectedCount = selectedVerses?.size ?? 0;

  const handleInsert = () => {
    if (!selectable || !onInsertVerses || !selectedVerses || !activeBook)
      return;
    const html = buildVerseQuoteHtml({
      bookNameTh: activeBook.nameTh,
      chapterNumber: chapter,
      verseNumbers: [...selectedVerses],
      mode,
      enVerses,
      thVerses,
    });
    onInsertVerses(html);
  };

  return (
    <div className={cn("flex flex-1 flex-col gap-4", variant === "page" && "sm:gap-6")}>
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
          chapter={chapter}
          mode={mode}
          showStrongs={showStrongs}
          onBookChange={onBookChange}
          onChapterChange={onChapterChange}
          onModeChange={onModeChange}
          onShowStrongsChange={onShowStrongsChange}
        />
      )}

      <div
        className={cn(
          "p-3",
          variant === "page" && "sm:rounded-lg sm:border sm:p-6",
        )}
      >
        <h3 className="mb-3 text-lg font-semibold">
          {activeBook
            ? `${activeBook.nameTh} บทที่ ${chapter}`
            : `บทที่ ${chapter}`}
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
          <div className={selectable ? "pb-16" : undefined}>
            {verseNumbers.map((v) => (
              <VerseBlock
                key={v}
                verseNumber={v}
                enText={enVerses.get(v)}
                thText={thVerses.get(v)}
                mode={mode}
                showStrongs={showStrongs}
                selectable={selectable}
                selected={selectedVerses?.has(v)}
                onToggleSelect={() => onToggleVerse?.(v)}
              />
            ))}
          </div>
        )}
      </div>

      {selectable && selectedCount > 0 && (
        // แถบลอยล่างสุดของ panel — โผล่มาเมื่อติ๊กเลือกอย่างน้อย 1 ข้อ กด
        // แทรกทีเดียวเป็น blockquote เดียว (ดู grill-me 2026-08-13)
        <div className="sticky bottom-0 -mx-3 flex items-center justify-between gap-2 border-t bg-background/95 p-3 backdrop-blur">
          <span className="text-sm text-muted-foreground">
            เลือกไว้ {selectedCount} ข้อ
          </span>
          <Button type="button" onClick={handleInsert}>
            แทรกข้อที่เลือก
          </Button>
        </div>
      )}
    </div>
  );
}
