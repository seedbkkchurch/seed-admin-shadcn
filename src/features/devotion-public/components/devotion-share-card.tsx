import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { BookOpen } from "lucide-react";
import { forwardRef } from "react";

// วันที่บนการ์ดเป็นไทยเต็ม ปี พ.ศ. เช่น "23 กันยายน 2569" (grill-me 2026-09-23)
// — date-fns format ปี ค.ศ. เสมอ จึงบวก 543 เอง
function formatThaiBuddhistDate(isoDate: string): string {
  const d = parseISO(isoDate);
  return `${format(d, "d MMMM", { locale: th })} ${d.getFullYear() + 543}`;
}

// การ์ดสรุปเฝ้าเดี่ยวสำหรับ "เซฟเป็นภาพ" (เหมือน og:image/og:description แบบ
// ที่คนเซฟเก็บไว้แชร์เองได้ ไม่ใช่ meta tag จริง เพราะแอปนี้เป็น SPA ไม่มี
// per-page SSR ที่จะทำ dynamic og:image ได้ — ดู grill-me 2026-09-20)
//
// Render แบบ off-screen ที่ขนาดจริง 1200x630 (ตาม og:image convention) แล้ว
// ให้ ShareButton จับภาพด้วย html-to-image — ไม่ใช่ screenshot ของหน้าจริง
// จึงคุม layout/ขนาดตัวอักษรให้อ่านง่ายในภาพนิ่งได้เอง
//
// ขนาด/สีทุกอย่างล็อกเป็น px และใช้ CSS var ของ shadcn theme ตรงๆ (ไม่ใช้
// Tailwind class ที่พึ่ง rem เพราะตอน capture เราอยากให้ output คงที่
// 1200x630 เป๊ะไม่ว่า root font-size ของหน้าจะเป็นเท่าไหร่)
export const DevotionShareCard = forwardRef<
  HTMLDivElement,
  {
    title: string;
    snippet: string;
    imageUrl?: string | null;
    imageFailed?: boolean;
    authorName?: string | null;
    authorAvatarUrl?: string | null;
    devotionDate?: string | null;
  }
>(function DevotionShareCard(
  {
    title,
    snippet,
    imageUrl,
    imageFailed,
    authorName,
    authorAvatarUrl,
    devotionDate,
  },
  ref,
) {
  const showImage = Boolean(imageUrl) && !imageFailed;
  // imageFailed = รอบ retry หลัง capture ล้ม (น่าจะเพราะรูปข้ามโดเมน) — ตัด
  // รูปโปรไฟล์ทิ้งด้วยเหมือนรูปปก แล้วใช้ตัวย่อชื่อแทน
  const showAvatar = Boolean(authorAvatarUrl) && !imageFailed;
  const dateLabel = devotionDate ? formatThaiBuddhistDate(devotionDate) : null;
  const authorLine = [authorName, dateLabel].filter(Boolean).join(" · ");

  return (
    <div
      ref={ref}
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--background)",
        color: "var(--foreground)",
        // ไม่ set fontFamily เอง — inherit จาก font stack ของแอป (Tailwind
        // default sans) ให้หน้าตาตรงกับที่อื่นในแอป
      }}
    >
      <div
        style={{
          flex: "1 1 0%",
          position: "relative",
          background: showImage
            ? undefined
            : "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
        }}
      >
        {showImage ? (
          // crossOrigin ให้ html-to-image ดึงรูปจาก Supabase storage มา
          // inline เป็น data URI เองตอน capture (ต้อง bucket เปิด CORS
          // สาธารณะ ซึ่งเป็นแบบนั้นอยู่แล้วเพราะหน้า public แสดงรูปนี้ได้)
          <img
            src={imageUrl ?? undefined}
            crossOrigin="anonymous"
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          // ไม่มีรูปปก — ใช้ไอคอนแทน (ตกลงใน grill-me 2026-09-20 เพิ่มเติม)
          // แทนพื้นสีเปล่าๆ ให้ยังดูเป็น "การ์ด" ไม่ใช่พื้นหลังว่าง
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen
              size={140}
              strokeWidth={1.25}
              color="var(--primary-foreground)"
              style={{ opacity: 0.9 }}
            />
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: "40px 48px 36px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 22,
            lineHeight: 1.5,
            color: "var(--muted-foreground)",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {snippet}
        </p>
        {/* แถวท้าย: [รูปโปรไฟล์] ชื่อ · วันที่ ซ้าย, แบรนด์ชิดขวา
        (grill-me 2026-09-23 — เหมือนแถวผู้เขียนบนหน้าเว็บ) */}
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              minWidth: 0,
            }}
          >
            {authorName && (
              <div
                style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: "9999px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--muted)",
                  color: "var(--muted-foreground)",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {showAvatar ? (
                  <img
                    src={authorAvatarUrl ?? undefined}
                    crossOrigin="anonymous"
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  authorName.slice(0, 2).toUpperCase()
                )}
              </div>
            )}
            {authorLine && (
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {authorLine}
              </div>
            )}
          </div>
          <div
            style={{
              flexShrink: 0,
              fontSize: 16,
              fontWeight: 500,
              color: "var(--muted-foreground)",
            }}
          >
            เฝ้าเดี่ยว · Seed Church
          </div>
        </div>
      </div>
    </div>
  );
});
