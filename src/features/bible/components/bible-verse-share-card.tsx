import { forwardRef } from "react";
import seedChurchLogo from "@/assets/seed-church-logo.png";

export type VerseShareLine = { verse: number; text: string };

type Props = {
  // รูปพื้นหลัง (Pexels) — null = พื้นเข้มเรียบ (ตอนโหลดรูปไม่ได้)
  imageUrl: string | null;
  thLines: VerseShareLine[];
  enLines: VerseShareLine[];
  // อ้างอิงหลัก เช่น "ยอห์น 3:16-18" และบรรทัดรอง เช่น "John 3:16-18 · KJV"
  reference: string;
  subReference: string;
  showVerseNumbers: boolean;
  // true = วาดเฉพาะชั้นบน (ไล่เฉด + ข้อความ + โลโก้) บนพื้นโปร่งใส ไม่มีรูป —
  // ใช้เป็น overlay ทับทุกเฟรมตอนสร้าง GIF เคลื่อนไหว (lib/animated-gif.ts)
  bare?: boolean;
};

const ACCENT = "#5DCAA5";

// ขนาดตัวอักษรตามความยาวข้อความรวม — ข้อสั้นตัวใหญ่ ข้อยาวย่อลง
// (grill-me 2026-11-08 "เลือกหลายข้อ ตัวหนังสือเล็กลงเอง")
export function verseFontSize(totalChars: number) {
  if (totalChars <= 80) return 66;
  if (totalChars <= 150) return 56;
  if (totalChars <= 240) return 48;
  if (totalChars <= 340) return 42;
  if (totalChars <= 460) return 36;
  return 31;
}
// เกินนี้การ์ดรับไม่ไหว ให้ผู้ใช้ลดจำนวนข้อ (คร่าวๆ 5–6 ข้อ)
export const VERSE_CARD_MAX_CHARS = 620;

function Lines({
  lines,
  fontSize,
  showNumbers,
  color,
}: {
  lines: VerseShareLine[];
  fontSize: number;
  showNumbers: boolean;
  color: string;
}) {
  return (
    <div style={{ fontSize, lineHeight: 1.55, color, fontWeight: 500 }}>
      {lines.map((l, i) => (
        <span key={l.verse}>
          {showNumbers && (
            <sup
              style={{
                fontSize: fontSize * 0.5,
                color: ACCENT,
                fontWeight: 700,
                marginRight: 6,
                verticalAlign: "super",
              }}
            >
              {l.verse}
            </sup>
          )}
          {l.text}
          {i < lines.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
}

// การ์ดแชร์ข้อพระคัมภีร์ แบบ C "ภาพพื้นหลัง" (grill-me 2026-11-08):
// 1080x1350, รูปเต็มการ์ด + ไล่เฉดดำจากล่างให้ตัวหนังสือขาวอ่านออกเสมอ,
// ข้อความชิดล่าง, อ้างอิงสีเขียวอ่อน, โลโก้ Seed Church ตัวจริงมุมขวาล่าง
// (บนวงขาว ให้โลโก้สีเขียวเห็นชัดบนรูปทุกแบบ)
export const BibleVerseShareCard = forwardRef<HTMLDivElement, Props>(
  function BibleVerseShareCard(
    {
      imageUrl,
      thLines,
      enLines,
      reference,
      subReference,
      showVerseNumbers,
      bare,
    },
    ref,
  ) {
    const thChars = thLines.reduce((n, l) => n + l.text.length, 0);
    const enChars = enLines.reduce((n, l) => n + l.text.length, 0);
    const both = thLines.length > 0 && enLines.length > 0;
    // ทั้งสองภาษา: ไทยตัวหลัก อังกฤษตัวรอง (เล็กกว่า ~0.62 เท่า)
    const mainChars =
      thLines.length > 0 ? thChars + (both ? enChars * 0.5 : 0) : enChars;
    const mainSize = verseFontSize(mainChars);

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1350,
          position: "relative",
          overflow: "hidden",
          background: bare ? "transparent" : "#1F2A24",
          color: "#ffffff",
        }}
      >
        {imageUrl && !bare && (
          <img
            src={imageUrl}
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
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.78) 70%, rgba(0,0,0,0.88) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "96px 88px 72px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 36,
          }}
        >
          {thLines.length > 0 && (
            <Lines
              lines={thLines}
              fontSize={mainSize}
              showNumbers={showVerseNumbers}
              color="#ffffff"
            />
          )}
          {enLines.length > 0 && (
            <Lines
              lines={enLines}
              fontSize={both ? Math.round(mainSize * 0.62) : mainSize}
              showNumbers={showVerseNumbers}
              color={both ? "rgba(255,255,255,0.82)" : "#ffffff"}
            />
          )}

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 24,
              marginTop: 12,
            }}
          >
            <div>
              <div
                style={{
                  width: 72,
                  height: 6,
                  background: ACCENT,
                  marginBottom: 20,
                }}
              />
              <div
                style={{
                  fontSize: 46,
                  fontWeight: 700,
                  color: ACCENT,
                  lineHeight: 1.3,
                }}
              >
                {reference}
              </div>
              {subReference && (
                <div
                  style={{
                    fontSize: 28,
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 6,
                  }}
                >
                  {subReference}
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 9999,
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={seedChurchLogo}
                  alt=""
                  style={{ width: 88, height: 88, objectFit: "contain" }}
                />
              </div>
              <span style={{ fontSize: 34, fontWeight: 700 }}>Seed Church</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
