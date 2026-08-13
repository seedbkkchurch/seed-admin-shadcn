import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BiblePanel } from "./bible-panel";
import { type BibleLanguageMode } from "../data/types";
import { loadQuickRefState, saveQuickRefState } from "../lib/quick-ref-storage";

type Stage = "closed" | "collapsed" | "expanded";

// คัมภีร์แบบ bottom sheet ยุบ/ขยายได้ — ฝังในหน้าเขียนเฝ้าเดี่ยว
// (devotion-editor.tsx ทั้งตอนสร้างใหม่และแก้ไข) ให้เปิดดูข้อพระคัมภีร์และ
// แทรกเข้าบทความได้โดยไม่ต้องออกจากหน้าเขียน (ดู grill-me 2026-08-13
// "เอา bible ไปใช้กับตอนเขียนเฝ้าเดี่ยว")
//
// 3 สถานะ (ไม่มี drag ด้วยมือ — โปรเจกต์นี้ไม่มี component แบบนั้น เลือกใช้
// 2 สถานะตายตัวสลับด้วยปุ่มแทน):
//   closed    = เห็นแค่ปุ่มลอยมุมขวาล่าง
//   collapsed = แถบเล็กติดขอบล่างจอ ไม่มีฉากทึบ พิมพ์ต่อในหน้าเขียนได้ปกติ
//   expanded  = modal เต็มจอแนวนอน ~85% มีฉากทึบ (ใช้ shadcn Sheet เดิม)
// กดฉาก/ปุ่ม X ตอน expanded → กลับไป collapsed เสมอ (ไม่ปิดสนิท) —
// ต้องกดปุ่ม X บนแถบ collapsed อีกทีถึงจะปิดสนิทกลับไปเป็นปุ่มลอย
export function BibleQuickReferenceSheet({
  onInsertHtml,
}: {
  onInsertHtml: (html: string) => void;
}) {
  const [stage, setStage] = useState<Stage>("closed");

  const [bookNumber, setBookNumber] = useState(1);
  const [chapter, setChapter] = useState(1);
  const [mode, setMode] = useState<BibleLanguageMode>("both");
  const [showStrongs, setShowStrongs] = useState(true);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(
    new Set(),
  );

  // โหลดค่าที่จำไว้ (localStorage) ตอน mount ครั้งแรกเท่านั้น — ทำใน effect
  // แทน lazy initializer เพื่อเลี่ยง SSR/hydration mismatch ถ้าอนาคตมี SSR
  // (ตอนนี้เป็น SPA ล้วนไม่มีผลจริง แต่กันไว้)
  useEffect(() => {
    const saved = loadQuickRefState();
    setBookNumber(saved.bookNumber);
    setChapter(saved.chapter);
    setMode(saved.mode);
    setShowStrongs(saved.showStrongs);
  }, []);

  useEffect(() => {
    saveQuickRefState({ bookNumber, chapter, mode, showStrongs });
  }, [bookNumber, chapter, mode, showStrongs]);

  // เปลี่ยนหนังสือ/บท → เลือกข้อที่ติ๊กไว้ไม่มีความหมายแล้ว เคลียร์ทิ้ง
  useEffect(() => {
    setSelectedVerses(new Set());
  }, [bookNumber, chapter]);

  const handleBookChange = (nextBook: number) => {
    setBookNumber(nextBook);
    setChapter(1);
  };

  const handleToggleVerse = (verseNumber: number) => {
    setSelectedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(verseNumber)) next.delete(verseNumber);
      else next.add(verseNumber);
      return next;
    });
  };

  const handleInsert = (html: string) => {
    onInsertHtml(html);
    setSelectedVerses(new Set());
    setStage("collapsed");
  };

  if (stage === "closed") {
    return (
      <Button
        type="button"
        size="icon"
        onClick={() => setStage("expanded")}
        className="fixed right-4 bottom-4 z-40 size-12 rounded-full shadow-lg"
        aria-label="เปิดคัมภีร์อ้างอิง"
      >
        <BookOpen className="size-5" />
      </Button>
    );
  }

  if (stage === "collapsed") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-2 border-t bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => setStage("expanded")}
          className="flex flex-1 items-center gap-2 text-start text-sm font-medium"
        >
          <BookOpen className="size-4 shrink-0 text-muted-foreground" />
          คัมภีร์อ้างอิง
          {selectedVerses.size > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              (เลือกไว้ {selectedVerses.size} ข้อ)
            </span>
          )}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setStage("closed")}
          aria-label="ปิดคัมภีร์อ้างอิง"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) setStage("collapsed");
      }}
    >
      <SheetContent side="bottom" className="flex h-[85vh] flex-col gap-0 p-0">
        <SheetHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b py-3">
          <SheetTitle>คัมภีร์อ้างอิง</SheetTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setStage("collapsed")}
            aria-label="ยุบ"
            className="me-8"
          >
            <ChevronDown className="size-4" />
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <BiblePanel
            variant="embedded"
            bookNumber={bookNumber}
            chapter={chapter}
            mode={mode}
            showStrongs={showStrongs}
            onBookChange={handleBookChange}
            onChapterChange={setChapter}
            onModeChange={setMode}
            onShowStrongsChange={setShowStrongs}
            selectable
            selectedVerses={selectedVerses}
            onToggleVerse={handleToggleVerse}
            onInsertVerses={handleInsert}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
