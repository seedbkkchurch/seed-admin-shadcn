import { useInfiniteQuery } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

// ค้นหา GIF จาก GIPHY ผ่าน Edge Function `giphy-proxy` (API key เป็น secret
// GIPHY_API_KEY ฝั่ง server — grill-me 2026-11-08) โครงเดียวกับ data/pexels.ts
export type GiphyGif = {
  id: string;
  title: string;
  giphyUrl: string;
  // ขนาด downsized (<2MB) — ใช้แทรกในบทความ/เป็นรูปปก
  gifUrl: string;
  width: number;
  height: number;
  thumbUrl: string;
};

type GiphySearchPage = {
  offset: number;
  nextOffset: number;
  hasNextPage: boolean;
  gifs: GiphyGif[];
};

async function searchGiphy(
  query: string,
  offset: number,
): Promise<GiphySearchPage> {
  const { data, error } = await supabase.functions.invoke<GiphySearchPage>(
    "giphy-proxy",
    { body: { query, offset } },
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
  if (!data) throw new Error("ค้นหา GIF ไม่สำเร็จ");
  return data;
}

// query ว่าง = GIF ยอดนิยม (trending)
export function useGiphySearch(query: string, enabled: boolean) {
  const trimmed = query.trim();
  return useInfiniteQuery({
    queryKey: ["giphy-search", trimmed],
    queryFn: ({ pageParam }) => searchGiphy(trimmed, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.hasNextPage ? last.nextOffset : undefined,
    enabled,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}
