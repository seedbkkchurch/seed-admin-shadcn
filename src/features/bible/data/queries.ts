import { useQuery } from "@tanstack/react-query";
import {
  type BibleBookFile,
  type BibleBookMeta,
  type StrongsDictionary,
} from "./types";

// ไฟล์ทั้งหมดอยู่ใน public/bible/ — preprocess จาก kjv_strongs.json / thaikjv.json
// / strongs-hebrew-dictionary.ts / strongs-greek-dictionary.js (ดู grill-me
// 2026-08-13 และหมายเหตุใน ./types.ts เรื่องทำไมแยกเป็น "ต่อเล่ม" แทน "ต่อบท")
// niv/ เพิ่มเข้ามาทีหลัง (2026-08-21) แปลงจาก NIV_en.SQLite3 ที่ผู้ใช้อัปโหลด
// ด้วย script ครั้งเดียว (ไม่ใช่ build step) — รูปแบบไฟล์เหมือน kjv/ ทุกประการ
// (book_name + chapters) ต่างกันแค่ไม่มีรหัส Strong's ฝังอยู่ในข้อความ
// esv/ เพิ่มมาอีกรอบ (2026-08-22) จาก ESV_en.SQLite3 แปลงแบบเดียวกันทุกอย่าง
// erv-en/ + erv-th/ เพิ่มมา (2026-08-24 "เพิ่ม ERV") preprocess จาก HTML
// ต้นฉบับที่ผู้ใช้อัปโหลด (engerv_html/ ต่อบท, html_THAERV/ ต่อเล่ม) — รูปแบบ
// ไฟล์เหมือนเดิม (book_name + chapters) แต่แต่ละข้อมี headings/footnotes
// เพิ่มเข้ามา (ดู ./types.ts)
const bibleKeys = {
  books: ["bible", "books"] as const,
  bookFile: (
    lang: "kjv" | "thai" | "niv" | "esv" | "erv-en" | "erv-th",
    bookNumber: number,
  ) => ["bible", "book-file", lang, bookNumber] as const,
  dictionary: (lang: "hebrew" | "greek") =>
    ["bible", "dictionary", lang] as const,
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`โหลด ${url} ไม่สำเร็จ (${res.status})`);
  return res.json() as Promise<T>;
}

export function useBibleBooks() {
  return useQuery({
    queryKey: bibleKeys.books,
    queryFn: () => fetchJson<BibleBookMeta[]>("/bible/books.json"),
    staleTime: Infinity,
  });
}

// โหลดทั้งเล่ม (cache ไว้ด้วย react-query key ตามเล่ม+ภาษา) แล้วให้ผู้เรียก
// slice เอาเฉพาะบทที่ต้องการเอง — สลับบทในเล่มเดียวกันจะไม่ยิง fetch ซ้ำ
export function useBibleBookFile(
  lang: "kjv" | "thai" | "niv" | "esv" | "erv-en" | "erv-th",
  bookNumber: number | undefined,
) {
  return useQuery({
    queryKey: bibleKeys.bookFile(lang, bookNumber ?? -1),
    enabled: bookNumber !== undefined,
    queryFn: () =>
      fetchJson<BibleBookFile>(`/bible/${lang}/${bookNumber}.json`),
    staleTime: Infinity,
  });
}

// Dictionary (Hebrew ~2MB, Greek ~1.2MB) โหลดแบบ lazy — enabled=false จนกว่าจะ
// มีคน hover/tap คำที่มีรหัส Strong's ครั้งแรก (ดู grill-me 2026-08-13)
export function useStrongsDictionary(
  lang: "hebrew" | "greek",
  enabled: boolean,
) {
  return useQuery({
    queryKey: bibleKeys.dictionary(lang),
    enabled,
    queryFn: () =>
      fetchJson<StrongsDictionary>(`/bible/strongs-${lang}-dictionary.json`),
    staleTime: Infinity,
  });
}
