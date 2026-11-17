import { type BibleBookMeta } from "../data/types";

// คำนวณความคืบหน้าการอ่านพระคัมภีร์ (grill-me 2026-11-16) จากรายชื่อ 66 เล่ม
// (public/bible/books.json) + แถวสรุปรายบทของคนคนหนึ่ง (view
// lamb_bible_reading_summary) — เปอร์เซ็นต์นับจาก "บทที่เคยอ่านอย่างน้อย
// หนึ่งครั้ง" จาก 1,189 บท อ่านซ้ำไม่ทำให้เปอร์เซ็นต์เพิ่ม แต่เก็บจำนวนครั้ง
// ต่อบทไว้แสดงในตารางเลขบท

// เล่มที่ 1-39 = พันธสัญญาเดิม, 40-66 = พันธสัญญาใหม่ (ลำดับมาตรฐาน)
export const LAST_OLD_TESTAMENT_BOOK = 39;

export type ChapterReadSummary = {
  book: number;
  chapter: number;
  timesRead: number;
  lastReadDate: string;
};

export type ReadTotals = { read: number; total: number };

export type BookProgress = {
  book: BibleBookMeta;
  read: number;
  total: number;
  /** บท → จำนวนครั้งที่อ่าน (เฉพาะบทที่เคยอ่าน) */
  timesByChapter: Map<number, number>;
  /** วันที่อ่านเล่มนี้ล่าสุด (yyyy-MM-dd) */
  lastReadDate: string | null;
  /** บทแรกที่ยังไม่เคยอ่าน — null เมื่ออ่านครบทั้งเล่ม */
  nextChapter: number | null;
  status: "none" | "reading" | "done";
};

export type ReadingProgress = {
  books: BookProgress[];
  all: ReadTotals;
  oldTestament: ReadTotals;
  newTestament: ReadTotals;
  booksDone: number;
  /** เล่มที่อ่านค้าง (เริ่มแล้วแต่ยังไม่ครบ) — อ่านล่าสุดขึ้นก่อน */
  inProgress: BookProgress[];
};

export function computeReadingProgress(
  books: BibleBookMeta[],
  rows: ChapterReadSummary[],
): ReadingProgress {
  const byBook = new Map<number, ChapterReadSummary[]>();
  for (const row of rows) {
    const list = byBook.get(row.book);
    if (list) list.push(row);
    else byBook.set(row.book, [row]);
  }

  const all: ReadTotals = { read: 0, total: 0 };
  const oldTestament: ReadTotals = { read: 0, total: 0 };
  const newTestament: ReadTotals = { read: 0, total: 0 };

  const progress = books.map<BookProgress>((book) => {
    const timesByChapter = new Map<number, number>();
    let lastReadDate: string | null = null;
    for (const row of byBook.get(book.number) ?? []) {
      // กันแถวที่เลขบทเกินจำนวนบทจริงของเล่ม ไม่ให้นับเกิน 100%
      if (row.chapter < 1 || row.chapter > book.chapterCount) continue;
      timesByChapter.set(row.chapter, row.timesRead);
      if (!lastReadDate || row.lastReadDate > lastReadDate) {
        lastReadDate = row.lastReadDate;
      }
    }

    let nextChapter: number | null = null;
    for (let chapter = 1; chapter <= book.chapterCount; chapter++) {
      if (!timesByChapter.has(chapter)) {
        nextChapter = chapter;
        break;
      }
    }

    const read = timesByChapter.size;
    const testament =
      book.number <= LAST_OLD_TESTAMENT_BOOK ? oldTestament : newTestament;
    testament.read += read;
    testament.total += book.chapterCount;
    all.read += read;
    all.total += book.chapterCount;

    return {
      book,
      read,
      total: book.chapterCount,
      timesByChapter,
      lastReadDate,
      nextChapter,
      status: read === 0 ? "none" : nextChapter === null ? "done" : "reading",
    };
  });

  const inProgress = progress
    .filter((item) => item.status === "reading")
    .sort(
      (a, b) =>
        (b.lastReadDate ?? "").localeCompare(a.lastReadDate ?? "") ||
        a.book.number - b.book.number,
    );

  return {
    books: progress,
    all,
    oldTestament,
    newTestament,
    booksDone: progress.filter((item) => item.status === "done").length,
    inProgress,
  };
}

// 0.3% / 4.2% / 15% — ต่ำกว่า 10 แสดงทศนิยม 1 ตำแหน่ง ไม่งั้นช่วงแรกจะค้างที่
// 0% นานเกินไป (1 บท = 0.08%)
export function formatPercent({ read, total }: ReadTotals): string {
  if (total === 0 || read === 0) return "0";
  const percent = (read / total) * 100;
  if (read === total) return "100";
  if (percent < 10) return Math.max(0.1, percent).toFixed(1);
  return String(Math.min(99, Math.round(percent)));
}
