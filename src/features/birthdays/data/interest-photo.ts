import { useQueries } from "@tanstack/react-query";
import { searchPexels } from "@/features/lamb-info/data/pexels";

// รูปสำรองของการ์ดวันเกิดสำหรับคนที่ไม่มีรูปโปรไฟล์ (grill-me 2026-11-15):
// ค้น Pexels สดผ่าน pexels-proxy ด้วย "สิ่งที่สนใจอย่างแรก" ของแต่ละคน ไม่เก็บ
// ลงฐานข้อมูล ผลค้นของแต่ละคำเก็บไว้ใน localStorage เปิดหน้าซ้ำจึงไม่เรียก
// Pexels อีก (โควตารวม 200 ครั้ง/ชม.) ค้นไม่เจอ/ค้นพลาด = ไม่มีรูป การ์ดจะใช้
// พื้นไล่สี + ไอคอนเค้กแทน
export type InterestPhoto = {
  imageUrl: string;
  photographer: string;
};

const STORAGE_KEY = "birthday-interest-photos-v1";
// เก็บ/เลือกจากผลลัพธ์ต้นๆ เท่านั้น — ยิ่งท้ายยิ่งไม่ตรงคำค้น
const KEEP = 5;

// ช่อง interesting เป็นข้อความอิสระ ไทยปนอังกฤษ คั่นด้วย , / หรือเว้นวรรค
// (เช่น "Cat,Music", "ดนตรี กีฬา", "Ice hockey / music") — เอารายการแรก:
// แยกด้วย , / ก่อน ถ้าไม่มีตัวคั่นและเป็นภาษาไทยค่อยแยกด้วยเว้นวรรค (วลี
// อังกฤษอย่าง "Fashion Art" ต้องอยู่ด้วยกัน) แล้วตัด "ชอบ" นำหน้าออก
export function firstInterest(interesting: string | null): string | null {
  if (!interesting) return null;
  const parts = interesting
    .split(/[,/、]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  let first = parts[0];
  if (!first) return null;
  if (parts.length === 1 && /[฀-๿]/.test(first)) {
    first = first.split(/\s+/)[0];
  }
  first = first.replace(/^ชอบ/, "").trim();
  return first ? first.slice(0, 100) : null;
}

type Cache = Record<string, InterestPhoto[]>;

function readCache(): Cache {
  try {
    const cache = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return cache && typeof cache === "object" ? (cache as Cache) : {};
  } catch {
    return {};
  }
}

async function fetchInterestPhotos(query: string): Promise<InterestPhoto[]> {
  const cached = readCache()[query];
  if (Array.isArray(cached)) return cached;

  const { photos } = await searchPexels(query, 1);
  // การ์ดเป็นแนวตั้ง 4:5 — เลือกจากรูปแนวตั้งก่อน ถ้าไม่มีค่อยใช้ทั้งหมด
  const portrait = photos.filter((photo) => photo.height >= photo.width);
  const pool = (portrait.length > 0 ? portrait : photos)
    .slice(0, KEEP)
    .map(({ imageUrl, photographer }) => ({ imageUrl, photographer }));

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readCache(), [query]: pool }),
    );
  } catch {
    // ไม่มี storage — ไม่เป็นไร แค่จะเรียก Pexels ใหม่ครั้งหน้า
  }
  return pool;
}

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

type InterestPhotoTarget = { id: string; interesting: string | null };

// คืน Map lambId → รูป สำหรับคนใน targets ที่ค้นเจอ คนที่สนใจเรื่องเดียวกัน
// (เช่น "music" หลายคน) ใช้ผลค้นชุดเดียวกัน แต่เลือกรูปต่างกันตาม id จะได้
// ไม่ซ้ำกันทั้งพัด
export function useInterestPhotos(
  targets: InterestPhotoTarget[],
): Map<string, InterestPhoto> {
  const wanted = targets
    .map((target) => ({
      id: target.id,
      query: firstInterest(target.interesting)?.toLowerCase() ?? null,
    }))
    .filter((t): t is { id: string; query: string } => t.query !== null);
  const queries = [...new Set(wanted.map((t) => t.query))];

  return useQueries({
    queries: queries.map((query) => ({
      queryKey: ["birthday-interest-photos", query],
      queryFn: () => fetchInterestPhotos(query),
      staleTime: Infinity,
      retry: false,
    })),
    combine: (results) => {
      const photos = new Map<string, InterestPhoto>();
      for (const { id, query } of wanted) {
        const pool = results[queries.indexOf(query)]?.data;
        if (pool && pool.length > 0) {
          photos.set(id, pool[hash(id) % pool.length]);
        }
      }
      return photos;
    },
  });
}
