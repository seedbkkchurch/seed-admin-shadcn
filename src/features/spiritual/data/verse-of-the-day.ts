import { getDayOfYear } from "date-fns";
import { useBibleBookFile, useBibleBooks } from "@/features/bible/data/queries";
import type { BibleVerse } from "@/features/bible/data/types";
import { useYouVersionVerseOfTheDay } from "@/features/bible-live/data/queries";
import { USFM_CODES } from "@/features/bible-live/data/usfm-codes";

// ข้อพระคัมภีร์ประจำวัน (grill-me 2026-11-15): ถาม YouVersion ว่าวันนี้คือ
// ข้อไหน (ทุกคนเห็นข้อเดียวกัน ไม่ต้องมีคนดูแลรายการ) แล้วอ่านเนื้อความจาก
// ไฟล์พระคัมภีร์ไทยในแอป (public/bible/thai = Thai KJV ฉบับเริ่มต้นของหน้า
// /bible) ถ้า API ล่ม/ตอบรูปแบบที่อ่านไม่ออก ใช้รายการสำรองด้านล่างวนตามวัน

export type VerseRef = {
  bookNumber: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
};

const BOOK_NUMBER_BY_USFM = Object.fromEntries(
  Object.entries(USFM_CODES).map(([number, code]) => [code, Number(number)]),
);

// passage_id ของ YouVersion: "ISA.12.2", ช่วงข้อ "PHP.4.6-7" หรือหลายข้อ
// ต่อกันด้วย "+" ("ISA.43.18+ISA.43.19") — รองรับเฉพาะที่อยู่ในบทเดียวกัน
// อย่างอื่นคืน null ให้ไปใช้รายการสำรอง
export function parsePassageId(passageId: string | undefined): VerseRef | null {
  if (!passageId) return null;
  let ref: VerseRef | null = null;

  for (const part of passageId.split("+")) {
    const match = /^([1-3]?[A-Z]{2,3})\.(\d+)\.(\d+)(?:-(\d+))?$/.exec(
      part.trim(),
    );
    if (!match) return null;
    const bookNumber = BOOK_NUMBER_BY_USFM[match[1]];
    if (!bookNumber) return null;
    const chapter = Number(match[2]);
    const start = Number(match[3]);
    const end = match[4] ? Number(match[4]) : start;

    if (!ref) {
      ref = { bookNumber, chapter, verseStart: start, verseEnd: end };
    } else if (ref.bookNumber === bookNumber && ref.chapter === chapter) {
      ref.verseStart = Math.min(ref.verseStart, start);
      ref.verseEnd = Math.max(ref.verseEnd, end);
    } else {
      return null;
    }
  }
  return ref;
}

// รายการสำรอง [เล่ม, บท, ข้อเริ่ม, ข้อจบ] — ใช้เมื่อเรียก YouVersion ไม่ได้
const FALLBACK_VERSES: [number, number, number, number][] = [
  [43, 3, 16, 16], // ยอห์น 3:16
  [19, 23, 1, 1], // สดุดี 23:1
  [50, 4, 13, 13], // ฟีลิปปี 4:13
  [20, 3, 5, 6], // สุภาษิต 3:5-6
  [23, 40, 31, 31], // อิสยาห์ 40:31
  [45, 8, 28, 28], // โรม 8:28
  [24, 29, 11, 11], // เยเรมีย์ 29:11
  [40, 11, 28, 28], // มัทธิว 11:28
  [6, 1, 9, 9], // โยชูวา 1:9
  [19, 46, 1, 1], // สดุดี 46:1
  [47, 5, 17, 17], // 2 โครินธ์ 5:17
  [48, 2, 20, 20], // กาลาเทีย 2:20
  [50, 4, 6, 7], // ฟีลิปปี 4:6-7
  [40, 6, 33, 33], // มัทธิว 6:33
  [19, 119, 105, 105], // สดุดี 119:105
  [45, 12, 2, 2], // โรม 12:2
  [60, 5, 7, 7], // 1 เปโตร 5:7
  [58, 11, 1, 1], // ฮีบรู 11:1
  [25, 3, 22, 23], // เพลงคร่ำครวญ 3:22-23
  [19, 37, 4, 4], // สดุดี 37:4
];

function fallbackVerse(day: number): VerseRef {
  const [bookNumber, chapter, verseStart, verseEnd] =
    FALLBACK_VERSES[day % FALLBACK_VERSES.length];
  return { bookNumber, chapter, verseStart, verseEnd };
}

// อ่านเนื้อความ (Thai KJV ในแอป) + ชื่อเล่ม/อ้างอิงของข้อที่ได้ ใช้ร่วมกันทั้ง
// ข้อประจำวันและข้อประจำสัปดาห์ — `verses` ส่งต่อให้หน้าต่างแชร์การ์ด
function useResolvedVerse(
  ref: VerseRef | null,
  waiting: boolean,
  isFallback: boolean,
) {
  const books = useBibleBooks();
  const bookFile = useBibleBookFile("thai", ref?.bookNumber);

  const verses: BibleVerse[] = ref
    ? (bookFile.data?.chapters[String(ref.chapter)] ?? []).filter(
        (verse) => verse.verse >= ref.verseStart && verse.verse <= ref.verseEnd,
      )
    : [];
  const book = ref
    ? books.data?.find((b) => b.number === ref.bookNumber)
    : undefined;
  const reference =
    ref && book
      ? `${book.nameTh} ${ref.chapter}:${ref.verseStart}${
          ref.verseEnd > ref.verseStart ? `-${ref.verseEnd}` : ""
        }`
      : undefined;

  return {
    ref,
    reference,
    bookNameTh: book?.nameTh,
    bookNameEn: book?.nameEn,
    verses,
    text: verses.map((verse) => verse.text.trim()).join(" "),
    isFallback,
    isPending: waiting || bookFile.isPending || books.isPending,
    isError:
      bookFile.isError || (!!ref && !bookFile.isPending && verses.length === 0),
  };
}

export function useVerseOfTheDay(today: Date) {
  const day = getDayOfYear(today);
  const votd = useYouVersionVerseOfTheDay(day);
  const parsed = parsePassageId(votd.data?.passage_id);
  // รอ YouVersion ตอบก่อน — ตอบไม่ได้/อ่านไม่ออกค่อยใช้รายการสำรอง
  const ref = votd.isPending ? null : (parsed ?? fallbackVerse(day));
  return useResolvedVerse(ref, votd.isPending, !votd.isPending && !parsed);
}
