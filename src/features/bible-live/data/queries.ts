import { useQuery } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

// เรียก youversion-proxy แล้วคืนแค่ body ชั้นใน (ไม่ใช่ {status,ok,body} ทั้ง
// ก้อนแบบที่หน้า Bible API Tester ใช้ — หน้านี้เป็น reader ไม่ใช่ dev tool
// เลยไม่ต้องโชว์ raw envelope ให้ผู้ใช้เห็น) ดึง error message จริงจาก
// error.context เหมือนที่แก้ไว้ใน features/bible-api-tester/data/queries.ts
// (grill-me follow-up 2026-08-20)
async function invokeProxy<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<{
    status: number;
    ok: boolean;
    body: T;
  }>("youversion-proxy", { body: { path, params } });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      let message = error.message;
      try {
        const details = (await error.context.json()) as { error?: string };
        if (details?.error) message = details.error;
      } catch {
        // เก็บ error.message เดิมไว้ถ้า parse ไม่ได้
      }
      throw new Error(message);
    }
    throw error;
  }
  if (!data) throw new Error("Edge Function ไม่คืนข้อมูลกลับมา");
  return data.body;
}

export type YouVersionBibleSummary = {
  id: string;
  abbreviation?: string;
  local_title?: string;
  title?: string;
};

// รายชื่อฉบับที่มี — เป็น metadata (ชื่อ/id) ไม่ใช่เนื้อความ cache ได้ตามปกติ
// ไม่กระทบประเด็นลิขสิทธิ์เนื้อหา (ดู grill-me 2026-08-20)
export function useYouVersionBibles(languageRange: string) {
  return useQuery({
    queryKey: ["bible-live", "bibles", languageRange],
    queryFn: () =>
      invokeProxy<{ data?: YouVersionBibleSummary[] }>("bibles", {
        "language_ranges[]": languageRange,
      }),
    staleTime: 60 * 60 * 1000,
  });
}

export type YouVersionPassageBody = {
  data?: {
    id?: string;
    reference?: string;
    content?: string;
    copyright?: string;
  };
  error?: string;
};

// เนื้อความจริง — cache สั้นๆ ใน memory ของแท็บนี้ระหว่างเปิดหน้าอยู่เท่านั้น
// (react-query cache ธรรมดา หายเมื่อรีเฟรช/ปิดแท็บ ไม่เคยเขียนลง
// localStorage/DB ที่ไหนเลย) เทียบเท่าพฤติกรรม cache ปกติของแอป Bible reader
// ทั่วไปตอนเปิดอ่าน ไม่ใช่การเก็บสำเนาถาวร (ดู grill-me 2026-08-20 ข้อ 7)
export function useLiveBiblePassage(
  bibleId: string | undefined,
  usfmRef: string | undefined,
) {
  return useQuery({
    queryKey: ["bible-live", "passage", bibleId, usfmRef],
    enabled: Boolean(bibleId && usfmRef),
    queryFn: () =>
      invokeProxy<YouVersionPassageBody>(`bibles/${bibleId}/passages/${usfmRef}`, {
        format: "text",
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
