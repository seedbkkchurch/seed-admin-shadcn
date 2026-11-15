import { useQuery } from "@tanstack/react-query";
import { format, getDayOfYear } from "date-fns";
import {
  type PexelsPhoto,
  searchPexels,
} from "@/features/lamb-info/data/pexels";

// รูปพื้นหลังของการ์ดข้อพระคัมภีร์ประจำวัน (grill-me 2026-11-15): สุ่มรูป
// ธรรมชาติจาก Pexels ผ่าน pexels-proxy ตัวเดียวกับปุ่มค้นรูปในหน้าเขียนเฝ้า
// เดี่ยว "สุ่ม" โดยเลือกจากวันที่ของปี — ทั้งวันทุกคนได้รูปเดียวกัน คู่กับข้อ
// ของวันนั้น พรุ่งนี้เปลี่ยนรูป เก็บรูปของวันนี้ไว้ใน localStorage ด้วย เปิดหน้า
// ซ้ำในวันเดียวกันจึงไม่เรียก Pexels อีก (โควตารวม 200 ครั้ง/ชม.)
const QUERIES = [
  "mountain sunrise",
  "forest sunlight",
  "calm lake",
  "sky clouds",
  "ocean horizon",
  "meadow morning",
  "starry night sky",
  "misty hills",
];
const STORAGE_KEY = "spiritual-daily-background-v1";

type Cached = { date: string; photo: PexelsPhoto };

function readCache(date: string): PexelsPhoto | null {
  try {
    const cached = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Cached | null;
    return cached?.date === date && cached.photo?.imageUrl
      ? cached.photo
      : null;
  } catch {
    return null;
  }
}

export function useDailyBackground(today: Date) {
  const date = format(today, "yyyy-MM-dd");
  const day = getDayOfYear(today);

  return useQuery({
    queryKey: ["spiritual", "daily-background", date, day],
    queryFn: async (): Promise<PexelsPhoto | null> => {
      const cached = readCache(date);
      if (cached) return cached;

      const { photos } = await searchPexels(QUERIES[day % QUERIES.length], 1);
      // การ์ดเป็นแนวนอน — เลือกจากรูปแนวนอนก่อน ถ้าไม่มีค่อยใช้ทั้งหมด
      const landscape = photos.filter((photo) => photo.width > photo.height);
      const pool = landscape.length > 0 ? landscape : photos;
      if (pool.length === 0) return null;
      const photo = pool[(day * 7) % pool.length];

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ date, photo } satisfies Cached),
        );
      } catch {
        // ไม่มี storage — ไม่เป็นไร แค่จะเรียก Pexels ใหม่ครั้งหน้า
      }
      return photo;
    },
    staleTime: Infinity,
    retry: false,
  });
}
