import { useInfiniteQuery } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

// ค้นหารูปจาก Pexels ผ่าน Edge Function `pexels-proxy` (API key อยู่ฝั่ง
// server เป็น secret PEXELS_API_KEY — ดู grill-me 2026-09-23)
export type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  pexelsUrl: string;
  photographer: string;
  photographerUrl: string;
  avgColor: string | null;
  alt: string;
  thumbUrl: string;
  imageUrl: string;
};

type PexelsSearchPage = {
  page: number;
  totalResults: number;
  hasNextPage: boolean;
  photos: PexelsPhoto[];
};

async function searchPexels(
  query: string,
  page: number,
): Promise<PexelsSearchPage> {
  const { data, error } = await supabase.functions.invoke<PexelsSearchPage>(
    "pexels-proxy",
    { body: { query, page } },
  );
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
  if (!data) throw new Error("ค้นหารูปไม่สำเร็จ");
  return data;
}

export function usePexelsSearch(query: string) {
  const trimmed = query.trim();
  return useInfiniteQuery({
    queryKey: ["pexels-search", trimmed],
    queryFn: ({ pageParam }) => searchPexels(trimmed, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
    enabled: trimmed.length > 0,
    // ผลค้นหาคำเดิมไม่ค่อยเปลี่ยน — cache ไว้ประหยัดโควตา 200 ครั้ง/ชม.
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}
