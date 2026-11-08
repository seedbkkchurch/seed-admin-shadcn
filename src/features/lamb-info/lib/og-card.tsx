import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { toBlob } from "html-to-image";
import { supabase } from "@/lib/supabase/client";
import { DevotionOgCard } from "../components/devotion-og-card";

// รูปพรีวิวลิงก์ (og:image) แบบ "การ์ดเฝ้าเดี่ยว" — grill-me 2026-11-08
//
// LINE crawler ไม่รัน JS จึงต้องมีไฟล์รูปจริงอยู่ที่ URL — สร้าง snapshot ใน
// เบราว์เซอร์ (วิธีเดียวกับปุ่มแชร์การ์ด: html-to-image) แล้วอัปโหลดขึ้น
// bucket-seed ที่ public/seedbkk/devotion/og/<id>.png (ใช้ policy อัปโหลดของ
// โฟลเดอร์ devotion เดิม ไม่ต้องเพิ่ม policy) แล้วจด URL ไว้ที่
// lamb_devotion.og_card_url ให้ middleware.ts ใช้แทนรูปเดิม/รูปแมว
//
// ตัวเลขเป็นค่า ณ ตอนสร้าง (ตกลงแล้วว่ารับได้ เพราะ LINE แคชพรีวิวนานอยู่แล้ว)
// สร้างใหม่เมื่อ: บันทึก/แก้ไขเฝ้าเดี่ยว, เจ้าของติ๊ก checkbox, หรือเจ้าของเปิด
// หน้ารายละเอียดของรายการที่ควรมีการ์ดแต่ยังไม่มี

const BUCKET = "bucket-seed";
const OG_PREFIX = "public/seedbkk/devotion/og";

type OgRow = {
  id: string;
  lamb_id: string;
  devotion_date: string;
  image_urls: string[] | null;
  is_public: boolean | null;
  use_card_og: boolean | null;
  og_card_url: string | null;
};

// null = ค่าเริ่มต้น: ใช้การ์ดเมื่อเฝ้าเดี่ยวไม่มีรูปของตัวเอง (แทนรูปแมว)
export function shouldUseOgCard(row: {
  use_card_og: boolean | null;
  image_urls: string[] | null;
}) {
  return row.use_card_og ?? !(row.image_urls && row.image_urls.length > 0);
}

async function renderToBlob(
  element: React.ReactElement,
  retry: () => React.ReactElement,
) {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;top:0;left:-99999px;pointer-events:none;";
  document.body.appendChild(host);
  const root = createRoot(host);
  const capture = async (el: React.ReactElement) => {
    flushSync(() => root.render(el));
    await document.fonts?.ready;
    await Promise.all(
      [...host.querySelectorAll("img")].map((img) =>
        img.decode().catch(() => undefined),
      ),
    );
    return toBlob(host.firstElementChild as HTMLElement, {
      pixelRatio: 1,
      cacheBust: true,
    });
  };
  try {
    try {
      return await capture(element);
    } catch {
      // รูปโปรไฟล์ข้ามโดเมนโหลดไม่ได้ — ลองใหม่แบบไม่มีรูป (ตัวย่อชื่อแทน)
      return await capture(retry());
    }
  } finally {
    root.unmount();
    host.remove();
  }
}

/**
 * สร้าง + อัปโหลดการ์ด og ของเฝ้าเดี่ยว แล้วบันทึก URL ลงแถว
 * - force=false: ข้ามถ้ามี og_card_url อยู่แล้ว
 * - ข้ามเสมอถ้ารายการไม่ใช่ public หรือไม่ได้เลือกใช้การ์ด
 * คืน URL ใหม่ หรือ null ถ้าไม่ได้สร้าง
 */
export async function ensureDevotionOgCard(
  devotionId: string,
  { force = false }: { force?: boolean } = {},
): Promise<string | null> {
  const { data: row, error } = await supabase
    .from("lamb_devotion")
    .select(
      "id, lamb_id, devotion_date, image_urls, is_public, use_card_og, og_card_url",
    )
    .eq("id", devotionId)
    .single();
  if (error) throw error;
  const r = row as OgRow;
  if (!r.is_public || !shouldUseOgCard(r)) return null;
  if (r.og_card_url && !force) return null;

  const [{ data: lamb }, { data: activity, error: actError }] =
    await Promise.all([
      supabase
        .from("lamb_info")
        .select("nick_name, first_name, last_name, profile_picture")
        .eq("id", r.lamb_id)
        .single(),
      supabase
        .from("lamb_devotion_activity")
        .select("devotion_date, content_type")
        .eq("lamb_id", r.lamb_id),
    ]);
  if (actError) throw actError;

  const name =
    lamb?.nick_name ||
    [lamb?.first_name, lamb?.last_name].filter(Boolean).join(" ") ||
    "เฝ้าเดี่ยว";
  const devotionDays = new Set(
    (activity ?? [])
      .filter((a) => a.content_type === "devotion" && a.devotion_date)
      .map((a) => a.devotion_date as string),
  );
  const month = parseISO(r.devotion_date);
  const monthCount = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  }).filter((d) => devotionDays.has(format(d, "yyyy-MM-dd"))).length;
  const yearPrefix = `${month.getFullYear()}-`;
  const yearCount = [...devotionDays].filter((d) =>
    d.startsWith(yearPrefix),
  ).length;

  const props = {
    name,
    today: new Date(),
    month,
    devotionDays,
    monthCount,
    yearCount,
  };
  const blob = await renderToBlob(
    <DevotionOgCard {...props} avatarUrl={lamb?.profile_picture} />,
    () => <DevotionOgCard {...props} avatarUrl={null} />,
  );
  if (!blob) throw new Error("capture failed");

  const path = `${OG_PREFIX}/${devotionId}.png`;
  const { error: upError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: true,
    });
  if (upError) throw upError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // ใส่ ?v= ให้ URL เปลี่ยนทุกครั้งที่สร้างใหม่ — กัน CDN/LINE ใช้รูปเก่าจากแคช
  const url = `${publicUrl}?v=${Date.now()}`;

  const { error: updError } = await supabase
    .from("lamb_devotion")
    .update({ og_card_url: url })
    .eq("id", devotionId);
  if (updError) throw updError;

  return url;
}
