import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { type ChapterReadSummary } from "../lib/reading-progress";

// บันทึกการอ่านพระคัมภีร์ (grill-me 2026-11-16) — ตาราง lamb_bible_reading
// หนึ่งแถวต่อ คน + เล่ม + บท + วัน (unique) "บทละไม่เกิน 1 ครั้งต่อวัน" จึง
// บังคับที่ฐานข้อมูลเลย วันนับตามเวลาไทย RLS: ทุกคนที่ล็อกอินอ่านได้ เพิ่ม/ลบ
// ได้เฉพาะแถวของตัวเอง (lamb_id = auth_lamb_id())
const PAGE_SIZE = 1000;

export const bibleReadingKeys = {
  summary: (lambId: string | undefined) =>
    ["bible", "reading-summary", lambId] as const,
};

// "วันนี้" ตามเวลาไทย (yyyy-MM-dd) — ตรงกับ default ของคอลัมน์ read_date
export function bangkokToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(new Date());
}

// สรุปรายบทของคนคนหนึ่งจาก view lamb_bible_reading_summary (สูงสุด 1,189
// แถว) — PostgREST ตัดที่ 1,000 แถวต่อคำขอ จึงดึงทีละหน้าจนหมด
export function useBibleReadingSummary(lambId: string | undefined) {
  return useQuery({
    queryKey: bibleReadingKeys.summary(lambId),
    enabled: !!lambId,
    queryFn: async (): Promise<ChapterReadSummary[]> => {
      const rows: ChapterReadSummary[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
          .from("lamb_bible_reading_summary")
          .select("book, chapter, times_read, last_read_date")
          .eq("lamb_id", lambId!)
          .order("book")
          .order("chapter")
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;

        for (const row of data ?? []) {
          if (row.book === null || row.chapter === null) continue;
          rows.push({
            book: row.book,
            chapter: row.chapter,
            timesRead: row.times_read ?? 0,
            lastReadDate: row.last_read_date ?? "",
          });
        }
        if (!data || data.length < PAGE_SIZE) break;
      }
      return rows;
    },
    staleTime: 5 * 60 * 1000,
  });
}

type ChapterRef = { lambId: string; book: number; chapter: number };

// นับว่าอ่านบทนี้ของวันนี้ — กดซ้ำ/เลื่อนซ้ำในวันเดียวกันไม่เพิ่มแถว
export function useMarkChapterRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lambId, book, chapter }: ChapterRef) => {
      const { error } = await supabase.from("lamb_bible_reading").upsert(
        { lamb_id: lambId, book, chapter, read_date: bangkokToday() },
        {
          onConflict: "lamb_id,book,chapter,read_date",
          ignoreDuplicates: true,
        },
      );
      if (error) throw error;
    },
    onSuccess: (_data, { lambId }) =>
      queryClient.invalidateQueries({
        queryKey: bibleReadingKeys.summary(lambId),
      }),
  });
}

// ยกเลิกการนับของวันนี้ (เฉพาะวันนี้ — ครั้งก่อนหน้ายังอยู่)
export function useUnmarkChapterReadToday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lambId, book, chapter }: ChapterRef) => {
      const { error } = await supabase
        .from("lamb_bible_reading")
        .delete()
        .eq("lamb_id", lambId)
        .eq("book", book)
        .eq("chapter", chapter)
        .eq("read_date", bangkokToday());
      if (error) throw error;
    },
    onSuccess: (_data, { lambId }) =>
      queryClient.invalidateQueries({
        queryKey: bibleReadingKeys.summary(lambId),
      }),
  });
}
