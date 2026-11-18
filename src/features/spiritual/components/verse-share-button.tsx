import { useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BibleVerseShareDialog } from "@/features/bible/components/bible-verse-share-dialog";
import type { BibleVerse } from "@/features/bible/data/types";
import type { VerseRef } from "../data/verse-of-the-day";

// ปุ่ม "แชร์" บนการ์ดข้อพระคัมภีร์ประจำวัน/สัปดาห์ (grill-me 2026-11-18) — เปิด
// หน้าต่างทำการ์ดแชร์ตัวเดียวกับหน้าพระคัมภีร์ (BibleVerseShareDialog: เลือก
// รูป Pexels/GIF พื้นหลัง → สร้างการ์ด → แชร์) ข้อความมาจาก Thai KJV ในแอป
// จึงมีภาษาไทยภาษาเดียว
export function VerseShareButton({
  verse,
}: {
  verse: {
    ref: VerseRef | null;
    bookNameTh?: string;
    bookNameEn?: string;
    verses: BibleVerse[];
  };
}) {
  const [open, setOpen] = useState(false);
  const thVerses = useMemo(
    () => new Map(verse.verses.map((v) => [v.verse, v])),
    [verse.verses],
  );
  const enVerses = useMemo(() => new Map<number, BibleVerse>(), []);
  const verseNumbers = useMemo(
    () => verse.verses.map((v) => v.verse),
    [verse.verses],
  );

  if (!verse.ref || !verse.bookNameTh || verseNumbers.length === 0) return null;

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        className="bg-white/15 text-white hover:bg-white/25"
        onClick={() => setOpen(true)}
      >
        <Share2 />
        แชร์
      </Button>
      <BibleVerseShareDialog
        open={open}
        onOpenChange={setOpen}
        bookNameTh={verse.bookNameTh}
        bookNameEn={verse.bookNameEn ?? verse.bookNameTh}
        chapter={verse.ref.chapter}
        verseNumbers={verseNumbers}
        enVerses={enVerses}
        thVerses={thVerses}
        mode="th"
        versionCode="Thai KJV"
      />
    </>
  );
}
