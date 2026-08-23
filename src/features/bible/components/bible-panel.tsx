import { useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useBibleBookFile, useBibleBooks } from "../data/queries";
import { type BibleEnglishVersion, type BibleLanguageMode } from "../data/types";
import { buildVerseQuoteHtml } from "../lib/build-verse-quote-html";
import { BibleNav } from "./bible-nav";
import { BibleReadingMode, ReadingModeFab } from "./bible-reading-mode";
import { VerseBlock, versesToMap } from "./verse-block";

export type BiblePanelProps = {
  bookNumber: number;
  chapter: number;
  mode: BibleLanguageMode;
  showStrongs: boolean;
  // ฉบับแปลอังกฤษ — KJV (มี Strong's) หรือ NIV/ESV (เพิ่มเข้ามา 2026-08-21 /
  // 2026-08-22 ตามที่ผู้ใช้อัปโหลด NIV_en.SQLite3 / ESV_en.SQLite3 มาเอง
  // ขอให้ "ทำเหมือนกันเลย" กับ KJV)
  enVersion: BibleEnglishVersion;
  onBookChange: (bookNumber: number, chapter?: number) => void;
  onChapterChange: (chapter: number) => void;
  onModeChange: (mode: BibleLanguageMode) => void;
  onShowStrongsChange: (show: boolean) => void;
  onEnVersionChange: (version: BibleEnglishVersion) => void;
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
//
// เพิ่มโหมดอ่านเต็มจอบนมือถือ (BibleReadingMode) 2026-08-21 — ปุ่มลอยมุมขวา
// ล่าง (เฉพาะจอ <768px) เปิด/ปิดเอง ใช้ข้อมูล books/enVerses/thVerses ชุด
// เดียวกับรายการปกติด้านล่าง ไม่ fetch ซ้ำ (ดู grill-me 2026-08-21)
export function BiblePanel({
  bookNumber,
  chapter,
  mode,
  showStrongs,
  enVersion,
  onBookChange,
  onChapterChange,
  onModeChange,
  onShowStrongsChange,
  onEnVersionChange,
  variant = "page",
  selectable = false,
  selectedVerses,
  onToggleVerse,
  onInsertVerses,
}: BiblePanelProps) {
  const isMobile = useIsMobile();
  const [readingMode, setReadingMode] = useState(false);
  // จุด scroll เป้าหมายตอนกดปุ่มบทถัดไป/ก่อนหน้าแบบธรรมดา (ไม่ใช่
  // full-screen reading mode) — เลื่อนขึ้นไปเหนือหัวข้อ "บทที่ X" หลังเปลี่ยน
  // บท เพราะอ่านพระคัมภีร์ไล่บนลงล่าง กดปุ่มที่อยู่ล่างสุดของรายการข้อแล้ว
  // อยากกลับไปเริ่มอ่านบทใหม่จากบนสุดทันที ไม่ต้องเลื่อนเอง (ดู grill-me
  // 2026-08-23 "ไว้ล่างสุด เราอ่าน bible จากบนลงล่างขึ้นบ้างสิ")
  const headingRef = useRef<HTMLDivElement>(null);

  const { data: books, isPending: booksPending, isError: booksError } =
    useBibleBooks();

  const activeBook = books?.find((b) => b.number === bookNumber);
  const chapterCount = activeBook?.chapterCount ?? 1;

  const enFile = useBibleBookFile(
    enVersion === "niv" || enVersion === "esv" ? enVersion : "kjv",
    bookNumber,
  );
  const thaiFile = useBibleBookFile("thai", bookNumber);

  // ไฟล์ NIV/ESV ไม่มีภาษาไทย (ดึงมาจาก .SQLite3 ที่เป็นอังกฤษล้วน) — บังคับ
  // โหมดภาษาเป็น "อังกฤษอย่างเดียว" ตอนเลือก NIV/ESV โดยไม่ต้อง setState ใน
  // effect (คำนวณสดทุก render แทน) ค่า `mode` ดิบที่ผู้ใช้เคยเลือกไว้ (เช่น
  // "ทั้งสองภาษา") ยังจำอยู่เหมือนเดิม พอสลับกลับ KJV ก็คืนค่าเดิมให้เอง (ดู
  // grill-me 2026-08-21 "ถ้า NIV มีแค่ภาษาอังกฤษ ให้แสดง dropdown แค่ภาษา
  // อังกฤษ" — esv เพิ่มมา 2026-08-22 ทำเหมือนกัน) — ใช้ effectiveMode แทน
  // mode ดิบทุกจุดที่ตัดสินใจว่าจะโชว์/โหลดภาษาไหน (BibleNav, VerseBlock,
  // BibleReadingMode, buildVerseQuoteHtml)
  const isEnOnlyVersion = enVersion === "niv" || enVersion === "esv";
  const effectiveMode: BibleLanguageMode =
    isEnOnlyVersion && mode !== "en" ? "en" : mode;

  const enVerses = versesToMap(enFile.data?.chapters[String(chapter)]);
  const thVerses = versesToMap(thaiFile.data?.chapters[String(chapter)]);
  const verseNumbers = Array.from(
    new Set([...enVerses.keys(), ...thVerses.keys()]),
  ).sort((a, b) => a - b);

  const isLoadingChapter =
    (effectiveMode !== "th" && enFile.isPending) ||
    (effectiveMode !== "en" && thaiFile.isPending);
  const isChapterError = enFile.isError || thaiFile.isError;

  const selectedCount = selectedVerses?.size ?? 0;

  const handleInsert = () => {
    if (!selectable || !onInsertVerses || !selectedVerses || !activeBook)
      return;
    const html = buildVerseQuoteHtml({
      bookNameTh: activeBook.nameTh,
      chapterNumber: chapter,
      verseNumbers: [...selectedVerses],
      mode: effectiveMode,
      enVerses,
      thVerses,
    });
    onInsertVerses(html);
  };

  const canOpenReadingMode =
    isMobile && !booksPending && !booksError && !isLoadingChapter && !isChapterError;

  // ปุ่มเปลี่ยนบทถัดไป/ก่อนหน้าของโหมดธรรมดา (ตรงข้ามกับ full-screen reading
  // mode ด้านบน ที่มีสไวป์ + ลูกศรลอยของตัวเองอยู่แล้ว) — ตรรกะข้ามเล่มต่อเนื่อง
  // เหมือนกับ goToChapter ใน bible-reading-mode.tsx ทุกประการ (สุดบท →
  // หนังสือถัดไปบท 1, บท 1 ถอยหลัง → หนังสือก่อนหน้าบทสุดท้าย) ตกลงกันใน
  // grill-me 2026-08-23 ว่าให้ใช้ทั้งหน้า /bible เต็มจอและแผงฝังตอนเขียน
  // เฝ้าเดี่ยว ทุกขนาดหน้าจอ (ไม่ใช่แค่มือถือเหมือน reading mode)
  const goToChapter = (dir: "next" | "prev") => {
    if (!books) return;
    if (dir === "next") {
      if (chapter < chapterCount) {
        onChapterChange(chapter + 1);
      } else {
        const next = books.find((b) => b.number === bookNumber + 1);
        if (next) onBookChange(next.number, 1);
      }
    } else {
      if (chapter > 1) {
        onChapterChange(chapter - 1);
      } else {
        const prev = books.find((b) => b.number === bookNumber - 1);
        if (prev) onBookChange(prev.number, prev.chapterCount);
      }
    }
    // รอ chapter ใหม่ render เสร็จก่อนค่อย scroll (ค่า chapter/verseNumbers
    // ในรอบ render นี้ยังเป็นของบทเก่าอยู่)
    requestAnimationFrame(() => {
      headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const canGoNextChapter =
    !!books &&
    (chapter < chapterCount || books.some((b) => b.number === bookNumber + 1));
  const canGoPrevChapter =
    !!books && (chapter > 1 || books.some((b) => b.number === bookNumber - 1));

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
          mode={effectiveMode}
          showStrongs={showStrongs}
          enVersion={enVersion}
          onBookChange={onBookChange}
          onChapterChange={onChapterChange}
          onModeChange={onModeChange}
          onShowStrongsChange={onShowStrongsChange}
          onEnVersionChange={onEnVersionChange}
        />
      )}

      <div
        className={cn(
          "p-3",
          variant === "page" && "sm:rounded-lg sm:border sm:p-6",
        )}
      >
        <h3 ref={headingRef} className="mb-3 scroll-mt-4 text-lg font-semibold">
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
                mode={effectiveMode}
                showStrongs={showStrongs}
                selectable={selectable}
                selected={selectedVerses?.has(v)}
                onToggleSelect={() => onToggleVerse?.(v)}
              />
            ))}

            {/* ปุ่มเปลี่ยนบทแบบธรรมดา — วางไว้ล่างสุดใต้ข้อสุดท้าย (ไม่ใช่
            เหนือหัวข้อ) เพราะอ่านพระคัมภีร์ไล่บนลงล่าง อ่านจบพอดีก็เจอปุ่ม
            เลื่อนบทต่อได้เลย ปุ่มไอคอนกลมแบบเดียวกับลูกศรลอยใน full-screen
            reading mode (ดู grill-me 2026-08-23) */}
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="rounded-full"
                disabled={!canGoPrevChapter}
                onClick={() => goToChapter("prev")}
                aria-label="บทก่อนหน้า"
              >
                ‹
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="rounded-full"
                disabled={!canGoNextChapter}
                onClick={() => goToChapter("next")}
                aria-label="บทถัดไป"
              >
                ›
              </Button>
            </div>
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

      {canOpenReadingMode && !readingMode && (
        <ReadingModeFab
          onClick={() => setReadingMode(true)}
          bottomOffsetClassName={
            variant === "page"
              ? "bottom-[calc(var(--mobile-tab-bar-height)+1rem)]"
              : undefined
          }
        />
      )}

      {readingMode && books && (
        <BibleReadingMode
          books={books}
          bookNumber={bookNumber}
          chapter={chapter}
          verseNumbers={verseNumbers}
          enVerses={enVerses}
          thVerses={thVerses}
          mode={effectiveMode}
          showStrongs={showStrongs}
          enVersion={enVersion}
          onClose={() => setReadingMode(false)}
          onBookChange={onBookChange}
          onChapterChange={onChapterChange}
          onModeChange={onModeChange}
          onShowStrongsChange={onShowStrongsChange}
          onEnVersionChange={onEnVersionChange}
          selectable={selectable}
          selectedVerses={selectedVerses}
          onToggleVerse={onToggleVerse}
          selectedCount={selectedCount}
          onInsert={handleInsert}
        />
      )}
    </div>
  );
}
