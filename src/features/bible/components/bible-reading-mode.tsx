import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { BookOpen, Minus, Plus, Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { BookCombobox } from "./book-combobox";
import { ChapterInput } from "./chapter-input";
import { StrongsWord } from "./strongs-word";
import {
  type BibleBookMeta,
  type BibleEnglishVersion,
  type BibleLanguageMode,
} from "../data/types";
import { parseStrongsText } from "../lib/parse-strongs";
import {
  ensureGoogleFontLoaded,
  findLatinFont,
  findThaiFont,
  LATIN_READING_FONTS,
  READING_FONT_SIZE_STEPS,
  THAI_READING_FONTS,
} from "../lib/reading-mode-fonts";
import {
  loadReadingModeSettings,
  saveReadingModeSettings,
  type ReadingModeSettings,
} from "../lib/reading-mode-storage";

type ReadingModeProps = {
  books: BibleBookMeta[];
  bookNumber: number;
  chapter: number;
  verseNumbers: number[];
  enVerses: Map<number, string>;
  thVerses: Map<number, string>;
  mode: BibleLanguageMode;
  showStrongs: boolean;
  enVersion: BibleEnglishVersion;
  onClose: () => void;
  // chapter=undefined ตอนเปลี่ยนหนังสือ = ไปบทที่ 1 (ปกติ) — ตอนสไวป์ข้าม
  // หนังสือถอยหลังจะส่งบทสุดท้ายของเล่มก่อนหน้ามาแทน (ดู bible-panel.tsx)
  onBookChange: (bookNumber: number, chapter?: number) => void;
  onChapterChange: (chapter: number) => void;
  onModeChange: (mode: BibleLanguageMode) => void;
  onShowStrongsChange: (show: boolean) => void;
  onEnVersionChange: (version: BibleEnglishVersion) => void;
  // ใช้เฉพาะฝัง bottom sheet เขียนเฝ้าเดี่ยว (variant="embedded" ใน
  // BiblePanel) — แตะข้อความเพื่อเลือก/ยกเลิก แล้วกดแถบล่าง "แทรกข้อที่เลือก"
  selectable?: boolean;
  selectedVerses?: ReadonlySet<number>;
  onToggleVerse?: (v: number) => void;
  selectedCount?: number;
  onInsert?: () => void;
};

const SWIPE_COMMIT_PX = 70;
// |dx| ต้องมากกว่า |dy| ชัดๆ ถึงจะนับเป็นสไวป์เปลี่ยนบท ไม่งั้นถือเป็น scroll
// แนวตั้งตามปกติ (ดู grill-me 2026-08-21 "เช็คมุมเริ่มสัมผัส")
const SWIPE_DIRECTION_RATIO = 1.2;

// โหมดอ่านเต็มจอบนมือถือ — ซ่อน header/nav ทั้งหมด เหลือ top bar บางๆ,
// พระคัมภีร์ไหลต่อเนื่องแบบย่อหน้า (เลขข้อเป็น superscript), สไวป์ซ้าย-ขวา
// เปลี่ยนบท (ข้ามเล่มต่อเนื่องเมื่อสุดบท/แรกบท), ปรับขนาด+เลือกฟอนต์ Google
// Fonts แยกไทย/อังกฤษ, และเก็บ toggle ภาษา/Strong's/ฉบับแปลอังกฤษ (KJV/NIV/
// ESV) ไว้ในแผงตั้งค่าเดียวกัน — ดู grill-me 2026-08-21 (ทั้ง session การ
// สัมภาษณ์ออกแบบ และ "เพิ่ม NIV ไปด้วยนะทำเหมือนกันเลย") + 2026-08-22
// "เพิ่ม version ESV ให้ด้วยทำเหมือนเดิม"
export function BibleReadingMode({
  books,
  bookNumber,
  chapter,
  verseNumbers,
  enVerses,
  thVerses,
  mode,
  showStrongs,
  enVersion,
  onClose,
  onBookChange,
  onChapterChange,
  onModeChange,
  onShowStrongsChange,
  onEnVersionChange,
  selectable = false,
  selectedVerses,
  onToggleVerse,
  selectedCount = 0,
  onInsert,
}: ReadingModeProps) {
  const [settings, setSettings] = useState<ReadingModeSettings>(() =>
    loadReadingModeSettings(),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false);
  const [dragX, setDragX] = useState(0);

  useEffect(() => {
    saveReadingModeSettings(settings);
  }, [settings]);

  const thaiFont = findThaiFont(settings.thaiFontId);
  const latinFont = findLatinFont(settings.latinFontId);

  useEffect(() => {
    ensureGoogleFontLoaded(thaiFont.googleFamilyParam);
  }, [thaiFont]);
  useEffect(() => {
    ensureGoogleFontLoaded(latinFont.googleFamilyParam);
  }, [latinFont]);

  const activeBook = books.find((b) => b.number === bookNumber);
  const chapterCount = activeBook?.chapterCount ?? 1;
  const fontSizePx = READING_FONT_SIZE_STEPS[settings.fontSizeStepIndex];

  // จำทิศทางล่าสุด (สไวป์ซ้าย/ขวา) ไว้เลือกทิศแอนิเมชันเข้าของเนื้อหาบทใหม่ —
  // เปลี่ยนผ่านตัวเลือกบท/หนังสือใน sheet ไม่ต้องมีทิศ (fade เฉยๆ) ใช้ state
  // ไม่ใช้ ref เพราะค่านี้ถูกอ่านตอน render (คำนวณ class แอนิเมชัน) — อ่านค่า
  // ref ตอน render ไม่ปลอดภัย (eslint react-hooks/refs)
  const [direction, setDirection] = useState<"next" | "prev" | "none">(
    "none",
  );
  const touchStateRef = useRef<{
    x: number;
    y: number;
    swiping: boolean;
  } | null>(null);

  const goToChapter = (dir: "next" | "prev") => {
    setDirection(dir);
    if (dir === "next") {
      if (chapter < chapterCount) {
        onChapterChange(chapter + 1);
        return;
      }
      const next = books.find((b) => b.number === bookNumber + 1);
      if (next) onBookChange(next.number, 1);
      return;
    }
    if (chapter > 1) {
      onChapterChange(chapter - 1);
      return;
    }
    const prev = books.find((b) => b.number === bookNumber - 1);
    if (prev) onBookChange(prev.number, prev.chapterCount);
  };

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    touchStateRef.current = { x: t.clientX, y: t.clientY, swiping: false };
    setDragX(0);
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    const state = touchStateRef.current;
    if (!state) return;
    const t = e.touches[0];
    const dx = t.clientX - state.x;
    const dy = t.clientY - state.y;
    if (!state.swiping) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dx) > Math.abs(dy) * SWIPE_DIRECTION_RATIO) {
        state.swiping = true;
      } else {
        // แนวตั้งชัดกว่า → ปล่อยเป็น scroll ปกติ ไม่ยุ่งต่อจนกว่าจะปล่อยนิ้ว
        touchStateRef.current = null;
        return;
      }
    }
    e.preventDefault();
    setDragX(dx);
  };

  const handleTouchEnd = () => {
    const state = touchStateRef.current;
    touchStateRef.current = null;
    if (!state?.swiping) {
      setDragX(0);
      return;
    }
    if (dragX <= -SWIPE_COMMIT_PX) {
      goToChapter("next");
    } else if (dragX >= SWIPE_COMMIT_PX) {
      goToChapter("prev");
    }
    setDragX(0);
  };

  const canGoNext =
    chapter < chapterCount || books.some((b) => b.number === bookNumber + 1);
  const canGoPrev =
    chapter > 1 || books.some((b) => b.number === bookNumber - 1);

  const contentKey = `${bookNumber}-${chapter}`;
  const enterAnim =
    direction === "next"
      ? "slide-in-from-right-8"
      : direction === "prev"
        ? "slide-in-from-left-8"
        : "";

  const showEn = mode === "en" || mode === "both";
  const showTh = mode === "th" || mode === "both";
  // แตะข้อเพื่อเลือก (embedded) กับ tap ดูความหมาย Strong's ชนกัน — เลือกทาง
  // "เลือกข้อ" เป็นหลักตอนอยู่ใน selectable mode (ดู grill-me 2026-08-21)
  const effectiveShowStrongs = showStrongs && !selectable;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="ปิดโหมดอ่าน"
        >
          <X className="size-5" />
        </Button>
        <button
          type="button"
          onClick={() => setChapterPickerOpen(true)}
          className="flex-1 truncate text-center text-sm font-semibold"
        >
          {activeBook
            ? `${activeBook.nameTh} บทที่ ${chapter}`
            : `บทที่ ${chapter}`}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          aria-label="ตั้งค่าการอ่าน"
        >
          <Settings2 className="size-5" />
        </Button>
      </div>

      <div
        className="relative flex-1 overflow-y-auto overscroll-contain"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          key={contentKey}
          className={cn(
            "mx-auto max-w-2xl px-4 py-6 duration-200 animate-in fade-in",
            enterAnim,
          )}
          style={{
            transform: dragX !== 0 ? `translateX(${dragX}px)` : undefined,
            lineHeight: 1.9,
          }}
        >
          {verseNumbers.length === 0 ? (
            <p className="text-muted-foreground text-sm">ไม่พบข้อมูลบทนี้</p>
          ) : (
            <>
              {showEn && (
                <p
                  className="mb-4"
                  style={{ fontFamily: latinFont.cssFamily, fontSize: fontSizePx }}
                >
                  {verseNumbers.map((v) => {
                    const text = enVerses.get(v);
                    if (!text) return null;
                    return (
                      <ReadingVerse
                        key={v}
                        verseNumber={v}
                        selectable={selectable}
                        selected={selectedVerses?.has(v)}
                        onToggle={() => onToggleVerse?.(v)}
                      >
                        {parseStrongsText(text).map((segment, i) =>
                          segment.type === "text" || !effectiveShowStrongs ? (
                            segment.text
                          ) : (
                            <StrongsWord
                              key={i}
                              text={segment.text}
                              codes={segment.codes}
                            />
                          ),
                        )}
                      </ReadingVerse>
                    );
                  })}
                </p>
              )}
              {showTh && (
                <p
                  style={{
                    fontFamily: thaiFont.cssFamily,
                    fontSize: fontSizePx,
                  }}
                  className={cn(mode === "both" && "text-muted-foreground")}
                >
                  {verseNumbers.map((v) => {
                    const text = thVerses.get(v);
                    if (!text) return null;
                    return (
                      <ReadingVerse
                        key={v}
                        verseNumber={v}
                        selectable={selectable}
                        selected={selectedVerses?.has(v)}
                        onToggle={() => onToggleVerse?.(v)}
                      >
                        {text}
                      </ReadingVerse>
                    );
                  })}
                </p>
              )}
            </>
          )}
        </div>

        {/* ลูกศรเปลี่ยนบทสำรอง เผื่อสไวป์ไม่ถนัด — จางๆ ไม่บังเนื้อหา */}
        <div className="pointer-events-none sticky inset-x-0 bottom-3 z-10 flex items-center justify-between px-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="pointer-events-auto rounded-full opacity-70 shadow"
            disabled={!canGoPrev}
            onClick={() => goToChapter("prev")}
            aria-label="บทก่อนหน้า"
          >
            ‹
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="pointer-events-auto rounded-full opacity-70 shadow"
            disabled={!canGoNext}
            onClick={() => goToChapter("next")}
            aria-label="บทถัดไป"
          >
            ›
          </Button>
        </div>
      </div>

      {selectable && selectedCount > 0 && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-background/95 p-3 backdrop-blur">
          <span className="text-sm text-muted-foreground">
            เลือกไว้ {selectedCount} ข้อ
          </span>
          <Button type="button" onClick={onInsert}>
            แทรกข้อที่เลือก
          </Button>
        </div>
      )}

      <Sheet open={chapterPickerOpen} onOpenChange={setChapterPickerOpen}>
        <SheetContent side="bottom" className="p-4">
          <SheetHeader className="p-0">
            <SheetTitle>ไปยังบท</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">หนังสือ</span>
              <BookCombobox
                books={books}
                bookNumber={bookNumber}
                onChange={(b) => {
                  setDirection("none");
                  onBookChange(b, 1);
                  setChapterPickerOpen(false);
                }}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">บท (1-{chapterCount})</span>
              <ChapterInput
                chapter={chapter}
                chapterCount={chapterCount}
                onChange={(c) => {
                  setDirection("none");
                  onChapterChange(c);
                }}
                className="w-full"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-4">
          <SheetHeader className="p-0">
            <SheetTitle>ตั้งค่าการอ่าน</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">ขนาดตัวอักษร</span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={settings.fontSizeStepIndex === 0}
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      fontSizeStepIndex: Math.max(0, s.fontSizeStepIndex - 1),
                    }))
                  }
                  aria-label="ลดขนาดตัวอักษร"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-10 text-center text-sm tabular-nums">
                  {fontSizePx}px
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={
                    settings.fontSizeStepIndex ===
                    READING_FONT_SIZE_STEPS.length - 1
                  }
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      fontSizeStepIndex: Math.min(
                        READING_FONT_SIZE_STEPS.length - 1,
                        s.fontSizeStepIndex + 1,
                      ),
                    }))
                  }
                  aria-label="เพิ่มขนาดตัวอักษร"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            {showTh && (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">ฟอนต์ไทย</span>
                <Select
                  value={settings.thaiFontId}
                  onValueChange={(v) =>
                    setSettings((s) => ({ ...s, thaiFontId: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THAI_READING_FONTS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showEn && (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">ฟอนต์อังกฤษ</span>
                <Select
                  value={settings.latinFontId}
                  onValueChange={(v) =>
                    setSettings((s) => ({ ...s, latinFontId: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LATIN_READING_FONTS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">ภาษา</span>
              <Select
                value={mode}
                onValueChange={(v) => onModeChange(v as BibleLanguageMode)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* NIV/ESV เป็นอังกฤษล้วน ไม่มีไฟล์ไทย — ซ่อนตัวเลือกที่มี
                  ไทยออกเมื่อเลือก NIV/ESV (ดู grill-me 2026-08-21, 2026-08-22) */}
                  {enVersion !== "niv" && enVersion !== "esv" && (
                    <SelectItem value="both">ไทย + อังกฤษ</SelectItem>
                  )}
                  {enVersion !== "niv" && enVersion !== "esv" && (
                    <SelectItem value="th">ไทยอย่างเดียว</SelectItem>
                  )}
                  <SelectItem value="en">อังกฤษอย่างเดียว</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showEn && (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">ฉบับอังกฤษ</span>
                <Select
                  value={enVersion}
                  onValueChange={(v) =>
                    onEnVersionChange(v as BibleEnglishVersion)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kjv">KJV (มี Strong&apos;s)</SelectItem>
                    <SelectItem value="niv">NIV</SelectItem>
                    <SelectItem value="esv">ESV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {showEn && (
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={showStrongs}
                  onCheckedChange={onShowStrongsChange}
                />
                แสดงคำศัพท์ Strong&apos;s (ฮีบรู/กรีก)
              </label>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ReadingVerse({
  verseNumber,
  selectable,
  selected,
  onToggle,
  children,
}: {
  verseNumber: number;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}) {
  return (
    <span
      onClick={selectable ? onToggle : undefined}
      className={cn(
        "-mx-0.5 rounded px-0.5",
        selectable && "cursor-pointer",
        selected && "bg-primary/15",
      )}
    >
      <sup className="me-0.5 select-none text-muted-foreground">
        {verseNumber}
      </sup>
      {children}{" "}
    </span>
  );
}

// ปุ่มลอยเปิดโหมดอ่าน — ใช้ตำแหน่ง/สไตล์เดียวกันทั้งหน้า /bible เต็มจอ และ
// bottom sheet เขียนเฝ้าเดี่ยว, mobile เท่านั้น (md:hidden) ตามที่ตกลงกันไว้
// ("เวลาอยู่ในโหมดมือถือ" — ดู grill-me 2026-08-21)
export function ReadingModeFab({
  onClick,
  bottomOffsetClassName,
}: {
  onClick: () => void;
  bottomOffsetClassName?: string;
}) {
  return (
    <Button
      type="button"
      size="icon"
      onClick={onClick}
      className={cn(
        "fixed right-4 z-40 size-12 rounded-full shadow-lg md:hidden",
        bottomOffsetClassName ?? "bottom-4",
      )}
      aria-label="เปิดโหมดอ่าน"
    >
      <BookOpen className="size-5" />
    </Button>
  );
}
